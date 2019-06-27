pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Gatekeeper.sol";
import "./ParameterStore.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract TokenCapacitor {
    // EVENTS
    event ProposalCreated(
        address indexed proposer,
        uint indexed requestID,
        address indexed recipient,
        uint tokens,
        bytes metadataHash
    );
    event TokensWithdrawn(uint proposalID, address indexed to, uint numTokens);
    event Donation(address indexed payer, address indexed donor, uint numTokens, bytes metadataHash);

    // STATE
    using SafeMath for uint;

    // The address of the associated ParameterStore contract
    ParameterStore public parameters;

    struct Proposal {
        address gatekeeper;
        uint tokens;
        address to;
        bytes metadataHash;
        bool withdrawn;
    }

    // The proposals created for the TokenCapacitor. Maps requestIDs to proposals.
    mapping(uint => Proposal) public proposals;

    // The total number of proposals
    uint public proposalCount;

    // Token decay table
    uint256 constant PRECISION = 12;
    uint256 public scale;
    uint256[12] decayMultipliers;

    // Balances
    // Tokens available for withdrawal
    uint256 public unlockedBalance;

    // The number of tokens locked as of the last update
    uint256 public lastLockedBalance;

    // The last time tokens were locked
    uint256 public lastLockedTime;

    // The total number of tokens released in the lifetime of the TokenCapacitor
    uint256 public lifetimeReleasedTokens;

    // IMPLEMENTATION
    constructor(ParameterStore _parameters) public {
        parameters = _parameters;

        require(address(_gatekeeper()) != address(0), "Gatekeeper address cannot be zero");
        require(address(_token()) != address(0), "Token address cannot be zero");

        // initialize multipliers
        decayMultipliers[0] = 999524050675;
        decayMultipliers[1] = 999048327879;
        decayMultipliers[2] = 998097561438;
        decayMultipliers[3] = 996198742149;
        decayMultipliers[4] = 992411933860;
        decayMultipliers[5] = 984881446469;
        decayMultipliers[6] = 969991463599;
        decayMultipliers[7] = 940883439455;
        decayMultipliers[8] = 885261646641;
        decayMultipliers[9] = 783688183013;
        decayMultipliers[10] = 614167168195;
        decayMultipliers[11] = 377201310488;

        scale = 10 ** PRECISION;

        lastLockedTime = now;
    }

    function _gatekeeper() private view returns(Gatekeeper) {
        return Gatekeeper(parameters.getAsAddress("gatekeeperAddress"));
    }

    function _token() private view returns(IERC20) {
        return IERC20(parameters.getAsAddress("tokenAddress"));
    }

    /**
     @dev Create a proposal to send tokens to a beneficiary.
     @param to The account to send the tokens to
     @param tokens The number of tokens to send
     @param metadataHash A reference to metadata describing the proposal
    */
    function createProposal(address to, uint tokens, bytes memory metadataHash) public returns(uint) {
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        Gatekeeper gatekeeper = _gatekeeper();
        Proposal memory p = Proposal({
            gatekeeper: address(gatekeeper),
            tokens: tokens,
            to: to,
            metadataHash: metadataHash,
            withdrawn: false
        });

        // Request permission from the Gatekeeper and store the proposal data for later.
        // If the request is approved, a user can execute the proposal by providing the
        // requestID.
        uint requestID = gatekeeper.requestPermission(metadataHash);
        proposals[requestID] = p;
        proposalCount = proposalCount.add(1);

        emit ProposalCreated(msg.sender, requestID, to, tokens, metadataHash);
        return requestID;
    }

    /**
     @dev Create multiple proposals to send tokens to beneficiaries.
     @param beneficiaries The accounts to send tokens to
     @param tokenAmounts The number of tokens to send to each beneficiary
     @param metadataHashes Metadata hashes describing the proposals
    */
    function createManyProposals(
        address[] memory beneficiaries,
        uint[] memory tokenAmounts,
        bytes[] memory metadataHashes
    ) public {
        require(beneficiaries.length == tokenAmounts.length, "All inputs must have the same length");
        require(tokenAmounts.length == metadataHashes.length, "All inputs must have the same length");

        for (uint i = 0; i < beneficiaries.length; i++) {
            address to = beneficiaries[i];
            uint tokens = tokenAmounts[i];
            bytes memory metadataHash = metadataHashes[i];
            createProposal(to, tokens, metadataHash);
        }
    }

    /**
    @dev Withdraw tokens associated with a proposal and send them to the named beneficiary. The
    proposal must have been included in an accepted grant slate.
    @param proposalID The proposal
    */
    function withdrawTokens(uint proposalID) public returns(bool) {
        require(proposalID < proposalCount, "Invalid proposalID");

        Proposal memory p = proposals[proposalID];
        Gatekeeper gatekeeper = Gatekeeper(p.gatekeeper);

        require(gatekeeper.hasPermission(proposalID), "Proposal has not been approved");
        require(p.withdrawn == false, "Tokens have already been withdrawn for this proposal");

        IERC20 token = _token();
        proposals[proposalID].withdrawn = true;

        // Accounting
        updateBalances();
        // Withdrawn tokens come out of the unlocked balance
        require(unlockedBalance >= p.tokens, "Insufficient unlocked tokens");
        unlockedBalance = unlockedBalance.sub(p.tokens);

        lifetimeReleasedTokens = lifetimeReleasedTokens.add(p.tokens);

        require(token.transfer(p.to, p.tokens), "Failed to transfer tokens");
        emit TokensWithdrawn(proposalID, p.to, p.tokens);
        return true;
    }

    /**
    @dev Donate tokens on behalf of the given donor.
    Donor of `address(0)` indicates an unspecified donor.
    @param donor The account on behalf of which this donation is being made
    @param tokens The number of tokens to donate
    @param metadataHash A reference to metadata describing the donation
     */
    function donate(address donor, uint tokens, bytes memory metadataHash) public returns(bool) {
        require(tokens > 0, "Cannot donate zero tokens");

        address payer = msg.sender;

        // Donations go into the locked balance
        updateBalances();
        lastLockedBalance = lastLockedBalance.add(tokens);

        // transfer tokens from payer
        IERC20 token = _token();
        require(token.transferFrom(payer, address(this), tokens), "Failed to transfer tokens");

        emit Donation(payer, donor, tokens, metadataHash);
        return true;
    }


    /**
     @dev Number of tokens that will be unlocked by the given (future) time, not counting
     donations or withdrawals
     @param time The time to project for. Must after the lastLockedTime.
     */
    function projectedUnlockedBalance(uint256 time) public view returns(uint256) {
        uint256 futureUnlocked = lastLockedBalance.sub(projectedLockedBalance(time));
        return unlockedBalance.add(futureUnlocked);
    }

    /**
     @dev Number of tokens that will be locked by the given (future) time, not counting
     donations or withdrawals
     @param time The time to project for. Must be after the lastLockedTime.
     */
    function projectedLockedBalance(uint256 time) public view returns(uint256) {
        require(time >= lastLockedTime, "Time cannot be before last locked");
        uint256 elapsedTime = time.sub(lastLockedTime);

        // Based on the elapsed time (in days), calculate the decay factor
        uint256 decayFactor = calculateDecay(elapsedTime.div(86400));

        return lastLockedBalance.mul(decayFactor).div(scale);
    }

    /**
     @dev Return a scaled decay multiplier. Multiply by the balance, then divide by the scale.
     */
    function calculateDecay(uint256 _days) public view returns(uint256) {
        require(_days <= (2 ** decayMultipliers.length) - 1, "Time interval too large");

        uint256 decay = scale;
        uint256 d = _days;

        for (uint256 i = 0; i < decayMultipliers.length; i++) {
           uint256 remainder = d % 2;
           uint256 quotient = d >> 1;

           if (remainder == 1) {
                uint256 multiplier = decayMultipliers[i];
                decay = decay.mul(multiplier).div(scale);
           } else if (quotient == 0) {
               // Exit early if both quotient and remainder are zero
               break;
           }

           d = quotient;
        }

        return decay;
    }

    /**
     @dev Update the locked and unlocked balances according to the release rate, taking into account
     any donations or withdrawals since the last update. At each step, start decaying anew from the
     lastLockedBalance, as if it were the initial balance.
     @param time The time to update until. Must be less than 4096 days from the lastLockedTime.
     */
    function updateBalancesUntil(uint256 time) public {
        uint256 totalBalance = _token().balanceOf(address(this));

        // Sweep the released tokens from locked into unlocked
        // Locked balance is based on the decay since the last update
        uint256 newLockedBalance = projectedLockedBalance(time);
        assert(newLockedBalance <= lastLockedBalance);

        // Calculate the number of tokens unlocked since the last update
        unlockedBalance = lastLockedBalance.sub(newLockedBalance).add(unlockedBalance);

        // Lock any tokens not currently unlocked
        lastLockedBalance = totalBalance.sub(unlockedBalance);

        lastLockedTime = time;
    }

    /**
     @dev Update the locked and unlocked balances up until `now`.
     */
    function updateBalances() public {
        updateBalancesUntil(now);
    }
}
