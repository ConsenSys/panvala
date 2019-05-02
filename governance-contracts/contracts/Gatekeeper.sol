pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ParameterStore.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract Gatekeeper {
    // EVENTS
    event PermissionRequested(uint requestID, bytes metadataHash);
    event SlateCreated(uint slateID, address indexed recommender, bytes metadataHash);
    event SlateStaked(uint slateID, address indexed staker, uint numTokens);
    event VotingTokensDeposited(address indexed voter, uint numTokens);
    event VotingTokensWithdrawn(address indexed voter, uint numTokens);
    event BallotCommitted(uint indexed ballotID, address indexed voter, uint numTokens, bytes32 commitHash);
    event BallotRevealed(uint indexed ballotID, address indexed voter, uint numTokens);
    event ConfidenceVoteCounted(
        uint indexed ballotID,
        uint indexed categoryID,
        uint winningSlate,
        uint votes,
        uint totalVotes
    );
    event ConfidenceVoteFinalized(uint indexed ballotID, uint indexed categoryID, uint winningSlate);
    event ConfidenceVoteFailed(uint indexed ballotID, uint categoryID);
    event RunoffStarted(uint indexed ballotID, uint indexed categoryID, uint winningSlate, uint runnerUpSlate);
    event RunoffCounted(
        uint indexed ballotID,
        uint indexed categoryID,
        uint winningSlate,
        uint winnerVotes,
        uint losingSlate,
        uint loserVotes
    );
    event RunoffFinalized(uint indexed ballotID, uint indexed category, uint winningSlate);
    event StakeWithdrawn(uint slateID, address indexed staker, uint numTokens);

    // STATE
    using SafeMath for uint256;

    uint constant ONE_WEEK = 604800;

    // The timestamp of the start of the first batch
    uint public startTime;
    uint public batchLength = ONE_WEEK * 13; // 13 weeks

    // Parameters
    ParameterStore public parameters;

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
    enum SlateStatus {
        Unstaked,
        Staked,
        Rejected,
        Accepted
    }

    struct Slate {
        address recommender;
        bytes metadataHash;
        mapping(uint => bool) requestIncluded;
        uint[] requests;
        SlateStatus status;
        // Staking info
        address staker;
        uint stake;
    }
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

    // The votes for a slate in a contest
    struct SlateVotes {
        uint firstChoiceVotes;
        // slateID -> count
        mapping(uint => uint) secondChoiceVotes;
    }

    enum ContestStatus {
        Empty,
        NoContest,
        Started, // Active
        // Voting?
        VoteFinalized,
        RunoffPending,
        RunoffFinalized
    }

    struct Contest {
        ContestStatus status;

        // slateIDs
        uint[] slates;

        // slateID -> tally
        mapping(uint => SlateVotes) votes;

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
     @param _startTime The start time of the first batch
     @param _parameters The parameter store to use
    */
    constructor(uint _startTime, ParameterStore _parameters) public {
        parameters = _parameters;

        address tokenAddress = parameters.getAsAddress("tokenAddress");
        require(tokenAddress != address(0), "Token address cannot be zero");

        startTime = _startTime;
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
        // TODO: timing: batchNumber must be the current one
        // TODO: category must be valid
        // TODO: timing: the slate submission period must be active for the given epoch
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        // create slate
        Slate memory s = Slate({
            recommender: msg.sender,
            metadataHash: metadataHash,
            requests: requestIDs,
            status: SlateStatus.Unstaked,
            staker: address(0),
            stake: 0
        });

        // Record slate and return its ID
        uint slateID = slateCount;
        slates[slateID] = s;
        slateCount = slateCount.add(1);

        // Set up the requests
        for (uint i = 0; i < requestIDs.length; i++) {
            uint requestID = requestIDs[i];
            require(requestID < requestCount, "Invalid requestID");

            require(slates[slateID].requestIncluded[requestID] == false, "Duplicate requests are not allowed");
            slates[slateID].requestIncluded[requestID] = true;
        }

        // Associate the slate with a contest and update the contest status
        // A vote can only happen if there is more than one associated slate
        Contest storage c = ballots[batchNumber].contests[categoryID];
        c.slates.push(slateID);

        uint numSlates = c.slates.length;
        assert(numSlates >= 1);
        if (numSlates == 1) {
            c.status = ContestStatus.NoContest;
        } else {
            c.status = ContestStatus.Started;
        }

        emit SlateCreated(slateID, msg.sender, metadataHash);
        return slateID;
    }

    /**
    @dev Get a list of the requests associated with a slate
    @param slateID The slate
     */
    function slateRequests(uint slateID) public view returns(uint[] memory) {
        return slates[slateID].requests;
    }

    /**
    @dev Stake tokens on the given slate to include it for consideration in votes. If the slate
    loses in a contest, the amount staked will go to the winner. If it wins, it will be returned.
    @param slateID The slate to stake on
     */
    function stakeTokens(uint slateID) public returns(bool) {
        require(slateID < slateCount, "No slate exists with that slateID");

        address staker = msg.sender;
        IERC20 token = token();

        // Staker must have enough tokens
        uint stakeAmount = parameters.getAsUint("slateStakeAmount");
        require(token.balanceOf(staker) >= stakeAmount, "Insufficient token balance");

        // Transfer tokens and update the slate's staking info
        // Must successfully transfer tokens from staker to this contract
        Slate storage slate = slates[slateID];
        slate.staker = staker;
        slate.stake = stakeAmount;
        slate.status = SlateStatus.Staked;

        require(token.transferFrom(staker, address(this), stakeAmount), "Failed to transfer tokens");

        emit SlateStaked(slateID, staker, stakeAmount);
        return true;
    }


    /**
    @dev Withdraw tokens previously staked on a slate that was accepted through slate governance.
    @param slateID The slate to withdraw the stake from
     */
    function withdrawStake(uint slateID) public returns(bool) {
        require(slateID < slateCount, "No slate exists with that slateID");

        // get slate
        Slate memory slate = slates[slateID];

        require(slate.status == SlateStatus.Accepted, "Slate has not been accepted");
        require(msg.sender == slate.staker, "Only the original staker can withdraw this stake");
        require(slate.stake > 0, "Stake has already been withdrawn");

        // Update slate and transfer tokens
        slates[slateID].stake = 0;
        IERC20 token = token();
        require(token.transfer(slate.staker, slate.stake), "Failed to transfer tokens");

        emit StakeWithdrawn(slateID, slate.staker, slate.stake);
        return true;
    }

    /**
     @dev Deposit `numToken` tokens into the Gatekeeper to use in voting
     Assumes that `msg.sender` has approved the Gatekeeper to spend on their behalf
     @param numTokens The number of tokens to devote to voting
     */
    function depositVoteTokens(uint numTokens) public returns(bool) {
        address voter = msg.sender;

        // Voter must have enough tokens
        IERC20 token = token();
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
    @dev Withdraw `numTokens` vote tokens to the caller and decrease voting power
    @param numTokens The number of tokens to withdraw
     */
    function withdrawVoteTokens(uint numTokens) public returns(bool) {
        address voter = msg.sender;

        uint votingRights = voteTokenBalance[voter];
        require(votingRights >= numTokens, "Insufficient vote token balance");

        // Transfer tokens to decrease the voter's balance by `numTokens`
        voteTokenBalance[voter] = votingRights.sub(numTokens);

        IERC20 token = token();
        require(token.transfer(voter, numTokens), "Failed to transfer tokens");

        emit VotingTokensWithdrawn(voter, numTokens);
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
     @dev Reveal a given voter's choices for the current ballot and record their choices
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
        require(categories.length == firstChoices.length, "All inputs must have the same length");
        require(firstChoices.length == secondChoices.length, "All inputs must have the same length");

        require(didCommit(ballotID, voter), "Voter has not committed for this ballot");
        require(didReveal(ballotID, voter) == false, "Voter has already revealed for this ballot");

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
            SlateVotes storage slateVotes = contest.votes[firstChoice];
            slateVotes.firstChoiceVotes = slateVotes.firstChoiceVotes.add(v.numTokens);

            uint secondChoice = secondChoices[i];
            slateVotes.secondChoiceVotes[secondChoice] = slateVotes.secondChoiceVotes[secondChoice].add(v.numTokens);
        }

        // update state
        ballot.commitments[voter].revealed = true;

        emit BallotRevealed(ballotID, voter, v.numTokens);
    }

    /**
    @dev Reveal ballots for multiple voters
     */
    function revealManyBallots(
        address[] memory _voters,
        bytes[] memory _ballots,
        uint[] memory _salts
    ) public {
        uint numBallots = _voters.length;

        for (uint i = 0; i < numBallots; i++) {
            // extract categories, firstChoices, secondChoices from the ballot
            (
                uint[] memory categories,
                uint[] memory firstChoices,
                uint[] memory secondChoices
            ) = abi.decode(_ballots[i], (uint[], uint[], uint[]));

            revealBallot(_voters[i], categories, firstChoices, secondChoices, _salts[i]);
        }
    }

    /**
     @dev Get the number of first-choice votes cast for the given slate and category
     @param ballotID The ballot
     @param categoryID The category
     @param slateID The slate
     */
    function getFirstChoiceVotes(uint ballotID, uint categoryID, uint slateID) public view returns(uint) {
        SlateVotes storage v = ballots[ballotID].contests[categoryID].votes[slateID];
        return v.firstChoiceVotes;
    }

    /**
     @dev Get the number of second-choice votes cast for the given slate and category
     @param ballotID The ballot
     @param categoryID The category
     @param slateID The slate
     */
    function getSecondChoiceVotes(uint ballotID, uint categoryID, uint slateID) public view returns(uint) {
        // for each option that isn't this one, get the second choice votes
        Contest storage contest = ballots[ballotID].contests[categoryID];
        uint numSlates = contest.slates.length;
        uint votes = 0;
        for (uint i = 0; i < numSlates; i++) {
            uint otherSlateID = contest.slates[i];
            if (otherSlateID != slateID) {
                SlateVotes storage v = contest.votes[otherSlateID];
                // get second-choice votes for the target slate
                votes = votes.add(v.secondChoiceVotes[slateID]);
            }
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
     @dev Trigger a vote count and update the status of the contest

     Count the first choice votes for each slate. If a slate has more than 50% of the votes,
     then it wins and the vote is finalized. Otherwise, wait for a runoff.

     @param ballotID The ballot
     @param categoryID The category to count votes for
     */
    function countVotes(uint ballotID, uint categoryID) public {
        // TODO: revert if categoryID is invalid
        // TODO: revert if the ballot doesn't have a contest for this category
        Contest memory contest = ballots[ballotID].contests[categoryID];
        require(contest.status == ContestStatus.Started, "No contest is in progress for this category");
        assert(contest.slates.length > 1);

        // TODO: timing: must be after the vote period

        // Iterate through the slates and get the one with the most votes
        uint winner = 0;
        uint winnerVotes = 0;
        uint runnerUp = 0;
        uint runnerUpVotes = 0;

        uint total = 0;
        bool noCount = true;

        for (uint i = 0; i < contest.slates.length; i++) {
            noCount = false;

            uint slateID = contest.slates[i];
            SlateVotes storage currentSlate = ballots[ballotID].contests[categoryID].votes[slateID];

            uint votes = currentSlate.firstChoiceVotes;
            total = total.add(votes);

            if (votes > winnerVotes) {
                // Previous winner is now the runner-up
                runnerUp = winner;
                runnerUpVotes = winnerVotes;

                winner = slateID;
                winnerVotes = votes;
            } else if (votes > runnerUpVotes) {
                // This slate overtook the previous runner-up
                runnerUp = slateID;
                runnerUpVotes = votes;
            }
        }

        // TODO: what if no one has voted for anything?

        // Update state
        Contest storage updatedContest = ballots[ballotID].contests[categoryID];
        updatedContest.confidenceVoteWinner = winner;
        updatedContest.confidenceVoteRunnerUp = runnerUp;
        emit ConfidenceVoteCounted(ballotID, categoryID, winner, winnerVotes, total);

        // If the winner has more than 50%, we are done
        // Otherwise, trigger a runoff
        uint winnerPercentage = winnerVotes.mul(100).div(total);
        if (winnerPercentage > 50) {
            updatedContest.winner = winner;
            acceptWinningSlate(winner);
            rejectLosingSlates(ballotID, categoryID);
            updatedContest.status = ContestStatus.VoteFinalized;
            emit ConfidenceVoteFinalized(ballotID, categoryID, winner);
        } else {
            rejectEliminatedSlates(ballotID, categoryID);
            updatedContest.status = ContestStatus.RunoffPending;
            emit ConfidenceVoteFailed(ballotID, categoryID);
        }
    }

    /**
     @dev Return the status of the specified contest
     */
    function contestStatus(uint ballotID, uint categoryID) public view returns(ContestStatus) {
        return ballots[ballotID].contests[categoryID].status;
    }

    /**
     @dev Return the IDs of the slates associated with the contest
     */
    function contestSlates(uint ballotID, uint categoryID) public view returns(uint[] memory) {
        return ballots[ballotID].contests[categoryID].slates;
    }

    /**
     @dev Trigger a runoff count and update the status of the contest

     Revert if a runoff is not pending.
     Eliminate all slates but the top two from the confidence vote. Re-count, including the
     second-choice votes for the top two slates. The slate with the most votes wins. In case
     of a tie, the earliest slate submitted (slate with the lowest ID) wins.

     @param ballotID The ballot
     @param categoryID The category to count votes for
     */
    function countRunoffVotes(uint ballotID, uint categoryID) public {
        Contest memory contest = ballots[ballotID].contests[categoryID];
        require(contest.status == ContestStatus.RunoffPending, "Runoff is not pending");

        uint confidenceVoteWinner = contest.confidenceVoteWinner;
        uint confidenceVoteRunnerUp = contest.confidenceVoteRunnerUp;

        emit RunoffStarted(ballotID, categoryID, confidenceVoteWinner, confidenceVoteRunnerUp);

        // eliminate all but the winner and the runner-up from the confidence vote
        uint[] memory eliminated = new uint[](contest.slates.length.sub(2));
        uint index = 0;
        for (uint i = 0; i < contest.slates.length; i++) {
            uint slateID = contest.slates[i];
            if (slateID != confidenceVoteWinner && slateID != confidenceVoteRunnerUp) {
                eliminated[index] = slateID;
                index = index.add(1);
            }
        }

        // Get the number of first-choice votes for the top choices
        uint confidenceWinnerVotes = getFirstChoiceVotes(ballotID, categoryID, confidenceVoteWinner);
        uint confidenceRunnerUpVotes = getFirstChoiceVotes(ballotID, categoryID, confidenceVoteRunnerUp);

        // Count second-choice votes for the top two slates
        for (uint i = 0; i < eliminated.length; i++) {
            uint slateID = eliminated[i];
            SlateVotes storage currentSlate = ballots[ballotID].contests[categoryID].votes[slateID];

            // Second-choice votes for the winning slate
            uint votesForWinner = currentSlate.secondChoiceVotes[confidenceVoteWinner];
            confidenceWinnerVotes = confidenceWinnerVotes.add(votesForWinner);

            // Second-choice votes for the runner-up slate
            uint votesForRunnerUp = currentSlate.secondChoiceVotes[confidenceVoteRunnerUp];
            confidenceRunnerUpVotes = confidenceRunnerUpVotes.add(votesForRunnerUp);
        }

        // Tally for the runoff
        uint runoffWinner = 0;
        uint runoffWinnerVotes = 0;
        uint runoffLoser = 0;
        uint runoffLoserVotes = 0;

        // Original winner has more votes, or it's tied and the original winner has a smaller ID
        if ((confidenceWinnerVotes > confidenceRunnerUpVotes) ||
           ((confidenceWinnerVotes == confidenceVoteRunnerUp) &&
            (confidenceVoteWinner < confidenceVoteRunnerUp)
            )) {
            runoffWinner = confidenceVoteWinner;
            runoffWinnerVotes = confidenceWinnerVotes;
            runoffLoser = confidenceVoteRunnerUp;
            runoffLoserVotes = confidenceRunnerUpVotes;
        } else {
            runoffWinner = confidenceVoteRunnerUp;
            runoffWinnerVotes = confidenceRunnerUpVotes;
            runoffLoser = confidenceVoteWinner;
            runoffLoserVotes = confidenceWinnerVotes;
        }
        emit RunoffCounted(ballotID, categoryID, runoffWinner, runoffWinnerVotes, runoffLoser, runoffLoserVotes);

        // Update state
        Contest storage updatedContest = ballots[ballotID].contests[categoryID];
        updatedContest.winner = runoffWinner;
        updatedContest.status = ContestStatus.RunoffFinalized;
        acceptWinningSlate(runoffWinner);

        // Reject the losing slate
        slates[runoffLoser].status = SlateStatus.Rejected;

        emit RunoffFinalized(ballotID, categoryID, runoffWinner);
    }

    /**
    @dev Mark all but the winning slate as rejected
     */
    function rejectLosingSlates(uint ballotID, uint categoryID) internal {
        Contest storage contest = ballots[ballotID].contests[categoryID];
        uint winningSlate = contest.confidenceVoteWinner;

        // Reject all the other slates
        uint[] memory allSlates = contestSlates(ballotID, categoryID);
        uint numSlates = allSlates.length;
        for (uint i = 0; i < numSlates; i++) {
            uint slateID = allSlates[i];
            if (slateID != winningSlate) {
                slates[slateID].status = SlateStatus.Rejected;
            }
        }
    }

    /**
    @dev Mark all but the top two slates as rejected
     */
    function rejectEliminatedSlates(uint ballotID, uint categoryID) internal {
        Contest storage contest = ballots[ballotID].contests[categoryID];
        uint winningSlate = contest.confidenceVoteWinner;
        uint runnerUp = contest.confidenceVoteRunnerUp;

        // Reject all the other slates
        uint[] memory allSlates = contestSlates(ballotID, categoryID);
        uint numSlates = allSlates.length;
        for (uint i = 0; i < numSlates; i++) {
            uint slateID = allSlates[i];
            if (slateID != winningSlate && slateID != runnerUp) {
                slates[slateID].status = SlateStatus.Rejected;
            }
        }
    }

    /**
     @dev Return the ID of the winning slate for the given ballot and category
     Revert if the vote has not been finalized yet.
     @param ballotID The ballot of interest
     @param categoryID The category of interest
     */
    function getWinningSlate(uint ballotID, uint categoryID) public view returns(uint) {
        Contest storage c = ballots[ballotID].contests[categoryID];
        require(
            (c.status == ContestStatus.VoteFinalized) || (c.status == ContestStatus.RunoffFinalized),
            "Vote is not finalized yet"
        );

        return c.winner;
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

    /**
    @dev Update the winning slate and its associated requests
    @param slateID The slate to update
     */
    function acceptWinningSlate(uint slateID) internal {
        // TODO: must be a winner

        // Mark the slate as accepted
        Slate storage s = slates[slateID];
        s.status = SlateStatus.Accepted;

        // mark all of its requests as approved
        uint[] memory requestIDs = s.requests;
        for (uint i = 0; i < requestIDs.length; i++) {
            uint requestID = requestIDs[i];
            requests[requestID].approved = true;
        }
    }

    /**
    @dev Return true if the requestID has been approved via slate governance
    @param requestID The ID of the request to check
     */
    function hasPermission(uint requestID) public view returns(bool) {
        return requests[requestID].approved;
    }


    // MISCELLANEOUS GETTERS
    function token() public view returns(IERC20) {
        return IERC20(parameters.getAsAddress("tokenAddress"));
    }
}
