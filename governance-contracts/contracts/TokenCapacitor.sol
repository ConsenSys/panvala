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
        address indexed to,
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
        uint tokens;
        address to;
        bytes metadataHash;
        bool withdrawn;
    }

    // The proposals created for the TokenCapacitor. Maps requestIDs to proposals.
    mapping(uint => Proposal) public proposals;

    // The total number of proposals
    uint public proposalCount;

    // IMPLEMENTATION
    constructor(ParameterStore _parameters) public {
        parameters = _parameters;

        require(address(_gatekeeper()) != address(0), "Gatekeeper address cannot be zero");
        require(address(_token()) != address(0), "Token address cannot be zero");
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

        Proposal memory p = Proposal({
            tokens: tokens,
            to: to,
            metadataHash: metadataHash,
            withdrawn: false
        });

        // Request permission from the Gatekeeper and store the proposal data for later.
        // If the request is approved, a user can execute the proposal by providing the
        // requestID.
        uint requestID = _gatekeeper().requestPermission(metadataHash);
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
        Gatekeeper gatekeeper = _gatekeeper();
        require(gatekeeper.hasPermission(proposalID), "Proposal has not been approved");

        Proposal memory p = proposals[proposalID];

        require(p.withdrawn == false, "Tokens have already been withdrawn for this proposal");

        IERC20 token = _token();
        proposals[proposalID].withdrawn = true;

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

        // transfer tokens from payer
        IERC20 token = _token();
        require(token.transferFrom(payer, address(this), tokens), "Failed to transfer tokens");

        emit Donation(payer, donor, tokens, metadataHash);
        return true;
    }
}
