pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ParameterStore.sol";
import "./Slate.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract Gatekeeper {
    // EVENTS
    event PermissionRequested(uint requestID, bytes metadataHash);
    event SlateCreated(uint slateID, address indexed recommender, bytes metadataHash);
    event VotingTokensDeposited(address indexed voter, uint numTokens);
    event BallotCommitted(uint ballotID, address indexed voter, uint numTokens, bytes32 commitHash);
    event BallotRevealed(uint ballotID, address indexed voter, uint numTokens);

    // STATE
    using SafeMath for uint256;

    uint constant ONE_WEEK = 604800;

    // The timestamp of the start of the first batch
    uint public startTime;
    uint public batchLength = ONE_WEEK * 13; // 13 weeks

    // Parameters
    ParameterStore public parameters;

    // Token
    IERC20 public token;

    // Requests
    struct Request {
        bytes metadataHash;
        bool approved;
    }

    // The requests made to the Gatekeeper. Maps requestID -> Request.
    mapping(uint => Request) public requests;

    // The total number of requests created
    uint public requestCount;

    // Voting
    // The slates created by the Gatekeeper. Maps slateID -> Slate.
    mapping(uint => Slate) public slates;

    // The total number of slates created
    uint public slateCount;

    // The number of tokens each account has available for voting
    mapping(address => uint) public voteTokenBalance;

    // The data committed when voting
    struct VoteCommitment {
        bytes32 commitHash;
        uint numTokens;
        bool committed;
        bool revealed;
    }

    // An option in a contest
    struct VoteOption {
        uint firstChoiceVotes;
        // slateID -> count
        mapping(uint => uint) secondChoiceVotes;
        bool included;
    }

    enum ContestStatus {
        Empty,
        NoContest,
        Started, // Active
        // Voting?
        VoteFinalized,
        RunoffRequired,
        RunoffFinalized
    }

    struct Contest {
        ContestStatus status;

        // slateIDs
        uint[] slates;

        // slateID -> tally
        mapping(uint => VoteOption) options;

        // Intermediate results
        uint confidenceVoteWinner;
        uint confidenceVoteRunnerUp;

        // Final results
        uint winner;
    }

    // A group of Contests in an epoch
    struct Ballot {
        // status: Unopened, Open, Closed
        uint contestCount;
        // categoryID -> Contest
        mapping(uint => Contest) contests;
        bool created;

        // commitments for each voter
        mapping(address => VoteCommitment) commitments;
    }

    // All the ballots created so far
    // epoch number -> Ballot
    mapping(uint => Ballot) public ballots;


    // IMPLEMENTATION
    /**
     @dev Initialize a Gatekeeper contract.
     @param _token The associated ERC20 token
     @param _startTime The start time of the first batch
     @param _slateStakeAmount The number of tokens required to stake on a slate
    */
    constructor(IERC20 _token, uint _startTime, uint _slateStakeAmount) public {
        require(address(_token) != address(0), "Token address cannot be zero");

        startTime = _startTime;
        token = _token;

        uint length = 1;
        string[] memory names = new string[](length);
        uint[] memory values = new uint[](length);

        names[0] = "slateStakeAmount";
        values[0] = _slateStakeAmount;

        parameters = new ParameterStore(names, values);
    }

    // TIMING
    /**
    * @dev Get the number of the current epoch.
    */
    function currentEpochNumber() public pure returns(uint) {
        // uint elapsed = now.sub(startTime);
        // uint epoch = elapsed.div(batchLength);

        // return epoch;
        return 0;
    }

    /**
    * @dev Get the start of the current epoch.
    */
    function currentEpochStart() public view returns(uint) {
        uint epoch = currentEpochNumber();
        return startTime.add(batchLength.mul(epoch));
    }

    /**
    * @dev Get the number of the current batch.
    */
    function currentBatchNumber() public view returns(uint) {
        return currentEpochNumber();
    }


    // SLATE GOVERNANCE
    /**
    * @dev Create a new slate with the associated requestIds and metadata hash.
    * @param batchNumber The batch to submit for
    * @param categoryID The category to submit the slate for
    * @param requestIDs A list of request IDs to include in the slate
    * @param metadataHash A reference to metadata about the slate
    */
    function recommendSlate(
        uint batchNumber,
        uint categoryID,
        uint[] memory requestIDs,
        bytes memory metadataHash
    )
        public returns(uint)
    {
        // TODO: batchNumber must be the current one
        // TODO: category must be valid
        // TODO: all requestIDs must be unique
        for (uint i = 0; i < requestIDs.length; i++) {
            require(requestIDs[i] < requestCount, "Invalid requestID");
        }
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        // create slate
        Slate s = new Slate(msg.sender, metadataHash, requestIDs);

        // Record slate and return its ID
        uint slateID = slateCount;
        slates[slateID] = s;
        slateCount = slateCount.add(1);

        // Associate the slate with a contest and update the status
        Contest storage c = ballots[batchNumber].contests[categoryID];
        c.slates.push(slateID);

        uint numSlates = c.slates.length;
        if (numSlates == 1) {
            c.status = ContestStatus.NoContest;
        } else if (numSlates > 1) {
            c.status = ContestStatus.Started;
        }

        emit SlateCreated(slateID, msg.sender, metadataHash);
        return slateID;
    }

    /**
     @dev Deposit `numToken` tokens into the Gatekeeper to use in voting
     Assumes that `msg.sender` has approved the Gatekeeper to spend on their behalf
     @param numTokens The number of tokens to devote to voting
     */
    function depositVoteTokens(uint numTokens) public returns(bool) {
        address voter = msg.sender;

        // Voter must have enough tokens
        require(token.balanceOf(msg.sender) >= numTokens, "Insufficient token balance");

        // Transfer tokens to increase the voter's balance by `numTokens`
        uint originalBalance = voteTokenBalance[voter];
        voteTokenBalance[voter] = originalBalance.add(numTokens);

        // Must successfully transfer tokens from voter to this contract
        require(token.transferFrom(voter, address(this), numTokens), "Failed to transfer tokens");

        emit VotingTokensDeposited(voter, numTokens);
        return true;
    }


    /**
     @dev Submit a commitment for the current ballot
     @param commitHash The hash representing the voter's vote choices
     @param numTokens The number of vote tokens to use
     */
    function commitBallot(bytes32 commitHash, uint numTokens) public {
        address voter = msg.sender;

        uint ballotID = currentEpochNumber();

        // TODO: timing: commit period must be active for the given epoch
        require(didCommit(ballotID, voter) == false, "Voter has already committed for this ballot");
        require(commitHash != 0, "Cannot commit zero hash");

        // If the voter doesn't have enough tokens for voting, deposit more
        if (voteTokenBalance[voter] < numTokens) {
            uint remainder = numTokens.sub(voteTokenBalance[voter]);
            depositVoteTokens(remainder);
        }
        assert(voteTokenBalance[voter] >= numTokens);

        // TODO: If the ballot has not been created yet, create it
        Ballot storage ballot = ballots[ballotID];

        // Set the voter's commitment for the current ballot
        VoteCommitment memory commitment = VoteCommitment({
            commitHash: commitHash,
            numTokens: numTokens,
            committed: true,
            revealed: false
        });

        ballot.commitments[voter] = commitment;

        emit BallotCommitted(ballotID, voter, numTokens, commitHash);
    }

    /**
     @dev Return true if the voter has committed for the given ballot
     @param ballotID The ballot to check
     @param voter The voter's address
     */
    function didCommit(uint ballotID, address voter) public view returns(bool) {
        return ballots[ballotID].commitments[voter].committed;
    }

    /**
     @dev Get the commit hash for a given voter and ballot. Revert if voter has not committed yet.
     @param ballotID The ballot to check
     @param voter The voter's address
     */
    function getCommitHash(uint ballotID, address voter) public view returns(bytes32) {
        VoteCommitment memory v = ballots[ballotID].commitments[voter];
        require(v.committed, "Voter has not committed for this ballot");

        return v.commitHash;
    }


    /**
     @dev Reveal a given voter's choices for the current ballot
     @param voter The voter's address
     @param categories The contests to vote on
     @param firstChoices The corresponding first choices
     @param secondChoices The corresponding second choices
     @param salt The salt used to generate the original commitment
     */
    function revealBallot(
        address voter,
        uint[] memory categories,
        uint[] memory firstChoices,
        uint[] memory secondChoices,
        uint salt
    ) public {
        uint ballotID = currentEpochNumber();

        require(voter != address(0), "Voter address cannot be zero");
        require(didCommit(ballotID, voter), "Voter has not committed for this ballot");
        require(categories.length == firstChoices.length, "All inputs must have the same length");
        require(firstChoices.length == secondChoices.length, "All inputs must have the same length");
        // TODO: cannot reveal twice

        // TODO: timing: must be in reveal period

        // calculate the hash
        bytes memory buf;
        uint votes = categories.length;
        for (uint i = 0; i < votes; i++) {
            buf = abi.encodePacked(
                buf,
                categories[i],
                firstChoices[i],
                secondChoices[i]
            );
        }
        buf = abi.encodePacked(buf, salt);
        bytes32 hashed = keccak256(buf);

        Ballot storage ballot = ballots[ballotID];

        // compare to the stored data
        VoteCommitment memory v = ballot.commitments[voter];
        require(hashed == v.commitHash, "Submitted ballot does not match commitment");

        // Update tally for each contest
        for (uint i = 0; i < votes; i++) {
            uint category = categories[i];

            // get the contest for the current category
            Contest storage contest = ballot.contests[category];

            // Increment totals for first and second choice slates
            uint firstChoice = firstChoices[i];
            VoteOption storage option = contest.options[firstChoice];
            option.firstChoiceVotes = option.firstChoiceVotes.add(v.numTokens);

            uint secondChoice = secondChoices[i];
            option.secondChoiceVotes[secondChoice] = option.secondChoiceVotes[secondChoice].add(v.numTokens);
        }

        // update state
        ballot.commitments[voter].revealed = true;

        emit BallotRevealed(ballotID, voter, v.numTokens);
    }

    /**
     @dev Get the number of first-choice votes cast in the ballot for the given slate and category
     @param ballotID The ballot
     @param categoryID The category
     @param slateID The slate
     */
    function getFirstChoiceVotes(uint ballotID, uint categoryID, uint slateID) public view returns(uint) {
        VoteOption storage v = ballots[ballotID].contests[categoryID].options[slateID];
        return v.firstChoiceVotes;
    }

    function getSecondChoiceVotes(uint ballotID, uint categoryID, uint slateID) public view returns(uint) {
        // for each option that isn't this one, get the second choice votes
        Contest storage contest = ballots[ballotID].contests[categoryID];
        uint numSlates = contest.slates.length;
        uint votes = 0;
        for (uint i = 0; i < numSlates; i++) {
            uint otherSlateID = contest.slates[i];
            // if (otherSlateID != slateID) {
                VoteOption storage v = contest.options[otherSlateID];
                // get second-choice votes for the target slate
                votes = votes.add(v.secondChoiceVotes[slateID]);
            // }
        }
        return votes;
    }

    /**
     @dev Return true if the voter has revealed for the given ballot
     @param ballotID The ballot
     @param voter The voter's address
     */
    function didReveal(uint ballotID, address voter) public view returns(bool) {
        return ballots[ballotID].commitments[voter].revealed;
    }
    /**
     @dev Return the status of the specified contest
     */
    function contestStatus(uint ballotID, uint categoryID) public view returns(ContestStatus) {
        return ballots[ballotID].contests[categoryID].status;
    }

    // ACCESS CONTROL
    /**
    @dev Request permission to perform the action described in the metadataHash
    @param metadataHash A reference to metadata about the action
    */
    function requestPermission(bytes memory metadataHash) public returns(uint) {
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        // Create new request
        Request memory r = Request({
            metadataHash: metadataHash,
            approved: false
        });

        // Record request and return its ID
        uint requestID = requestCount;
        requests[requestID] = r;
        requestCount = requestCount.add(1);

        emit PermissionRequested(requestID, metadataHash);
        return requestID;
    }
}
