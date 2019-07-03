pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ParameterStore.sol";
import "./TokenCapacitor.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract Gatekeeper {
    // EVENTS
    event PermissionRequested(address resource, uint requestID, bytes metadataHash);
    event SlateCreated(uint slateID, address indexed recommender, bytes metadataHash);
    event SlateStaked(uint slateID, address indexed staker, uint numTokens);
    event VotingTokensDeposited(address indexed voter, uint numTokens);
    event VotingTokensWithdrawn(address indexed voter, uint numTokens);
    event DelegateSet(address indexed voter, address delegate);
    event BallotCommitted(uint indexed ballotID, address indexed voter, uint numTokens, bytes32 commitHash);
    event BallotRevealed(uint indexed ballotID, address indexed voter, uint numTokens);
    event ContestAutomaticallyFinalized(
        uint256 indexed ballotID,
        address indexed resource,
        uint256 winningSlate
    );
    event ContestFinalizedWithoutWinner(uint indexed ballotID, address indexed resource);
    event ConfidenceVoteCounted(
        uint indexed ballotID,
        address indexed resource,
        uint winningSlate,
        uint votes,
        uint totalVotes
    );
    event ConfidenceVoteFinalized(uint indexed ballotID, address indexed resource, uint winningSlate);
    event ConfidenceVoteFailed(uint indexed ballotID, address indexed resource);
    event RunoffStarted(uint indexed ballotID, address indexed resource, uint winningSlate, uint runnerUpSlate);
    event RunoffCounted(
        uint indexed ballotID,
        address indexed resource,
        uint winningSlate,
        uint winnerVotes,
        uint losingSlate,
        uint loserVotes
    );
    event RunoffFinalized(uint indexed ballotID, address indexed resource, uint winningSlate);
    event StakeWithdrawn(uint slateID, address indexed staker, uint numTokens);

    // STATE
    using SafeMath for uint256;

    uint constant ONE_WEEK = 604800;

    // The timestamp of the start of the first epoch
    uint public startTime;
    uint public constant EPOCH_LENGTH = ONE_WEEK * 13;
    uint public constant COMMIT_PERIOD_START = ONE_WEEK * 11;
    uint public constant REVEAL_PERIOD_START = ONE_WEEK * 12;

    // Parameters
    ParameterStore public parameters;

    // Requests
    struct Request {
        bytes metadataHash;
        // The resource (contract) the permission is being requested for
        address resource;
        bool approved;
        uint expirationTime;
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
        // Ballot info
        uint256 epochNumber;
        address resource;
    }
    // The slates created by the Gatekeeper. Maps slateID -> Slate.
    mapping(uint => Slate) public slates;

    // The total number of slates created
    uint public slateCount;

    // The number of tokens each account has available for voting
    mapping(address => uint) public voteTokenBalance;

    // The delegated account for each voting account
    mapping(address => address) public delegate;

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
        Active,
        RunoffPending,
        Finalized
    }

    struct Contest {
        ContestStatus status;

        // slateIDs
        uint[] slates;
        uint[] stakedSlates;
        uint256 lastStaked;

        // slateID -> tally
        mapping(uint => SlateVotes) votes;

        // Intermediate results
        uint confidenceVoteWinner;
        uint confidenceVoteRunnerUp;

        // Final results
        uint winner;
    }

    // The current incumbent for a resource
    mapping(address => address) public incumbent;

    // A group of Contests in an epoch
    struct Ballot {
        // status: Unopened, Open, Closed
        uint contestCount;
        // resource -> Contest
        mapping(address => Contest) contests;
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
        require(address(_parameters) != address(0), "Parameter store address cannot be zero");
        parameters = _parameters;

        address tokenAddress = parameters.getAsAddress("tokenAddress");
        require(tokenAddress != address(0), "Token address cannot be zero");

        startTime = _startTime;
    }

    // TIMING
    /**
    * @dev Get the number of the current epoch.
    */
    function currentEpochNumber() public view returns(uint) {
        uint elapsed = now.sub(startTime);
        uint epoch = elapsed.div(EPOCH_LENGTH);

        return epoch;
    }

    /**
    * @dev Get the start of the given epoch.
    */
    function epochStart(uint256 epoch) public view returns(uint) {
        return startTime.add(EPOCH_LENGTH.mul(epoch));
    }


    // SLATE GOVERNANCE
    /**
    * @dev Create a new slate with the associated requestIds and metadata hash.
    * @param resource The resource to submit the slate for
    * @param requestIDs A list of request IDs to include in the slate
    * @param metadataHash A reference to metadata about the slate
    */
    function recommendSlate(
        address resource,
        uint[] memory requestIDs,
        bytes memory metadataHash
    )
        public returns(uint)
    {
        uint256 epochNumber = currentEpochNumber();

        require(now < slateSubmissionDeadline(epochNumber, resource), "Submission deadline passed");
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        // create slate
        Slate memory s = Slate({
            recommender: msg.sender,
            metadataHash: metadataHash,
            requests: requestIDs,
            status: SlateStatus.Unstaked,
            staker: address(0),
            stake: 0,
            epochNumber: epochNumber,
            resource: resource
        });

        // Record slate and return its ID
        uint slateID = slateCount;
        slates[slateID] = s;
        slateCount = slateCount.add(1);

        // Set up the requests
        for (uint i = 0; i < requestIDs.length; i++) {
            uint requestID = requestIDs[i];
            require(requestID < requestCount, "Invalid requestID");

            // Every request's resource must match the one passed in
            require(requests[requestID].resource == resource, "Resource does not match");

            require(slates[slateID].requestIncluded[requestID] == false, "Duplicate requests are not allowed");
            slates[slateID].requestIncluded[requestID] = true;
        }

        // Assign the slate to the appropriate contest
        ballots[epochNumber].contests[resource].slates.push(slateID);

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
        require(slates[slateID].status == SlateStatus.Unstaked, "Slate has already been staked");

        address staker = msg.sender;
        IERC20 token = token();

        // Staker must have enough tokens
        uint stakeAmount = parameters.getAsUint("slateStakeAmount");
        require(token.balanceOf(staker) >= stakeAmount, "Insufficient token balance");

        Slate storage slate = slates[slateID];

        // Submission period must be active
        require(now < slateSubmissionDeadline(slate.epochNumber, slate.resource), "deadline passed");
        uint256 epochNumber = currentEpochNumber();
        assert(slate.epochNumber == epochNumber);

        // Transfer tokens and update the slate's staking info
        // Must successfully transfer tokens from staker to this contract
        slate.staker = staker;
        slate.stake = stakeAmount;
        slate.status = SlateStatus.Staked;
        require(token.transferFrom(staker, address(this), stakeAmount), "Failed to transfer tokens");

        // Associate the slate with a contest and update the contest status
        // A vote can only happen if there is more than one associated slate
        Contest storage contest = ballots[slate.epochNumber].contests[slate.resource];
        contest.stakedSlates.push(slateID);
        // offset from the start of the epoch, for easier calculations
        contest.lastStaked = now.sub(epochStart(epochNumber));

        uint256 numSlates = contest.stakedSlates.length;
        if (numSlates == 1) {
            contest.status = ContestStatus.NoContest;
        } else {
            contest.status = ContestStatus.Active;
        }

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
        require(commitPeriodActive() == false, "Tokens locked during voting");

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
     @dev Set a delegate account that can vote on behalf of the voter
     @param _delegate The account being delegated to
     */
    function delegateVotingRights(address _delegate) public returns(bool) {
        address voter = msg.sender;
        require(voter != _delegate, "Delegate and voter cannot be equal");

        delegate[voter] = _delegate;

        emit DelegateSet(voter, _delegate);
        return true;
    }

    /**
     @dev Submit a commitment for the current ballot
     @param voter The voter to commit for
     @param commitHash The hash representing the voter's vote choices
     @param numTokens The number of vote tokens to use
     */
    function commitBallot(address voter, bytes32 commitHash, uint numTokens) public {
        uint ballotID = currentEpochNumber();

        require(commitPeriodActive(), "Commit period not active");

        require(didCommit(ballotID, voter) == false, "Voter has already committed for this ballot");
        require(commitHash != 0, "Cannot commit zero hash");

        address committer = msg.sender;

        // Must be a delegate if not the voter
        if (committer != voter) {
            require(committer == delegate[voter], "Not a delegate");
            require(voteTokenBalance[voter] >= numTokens, "Insufficient tokens");
        } else {
            // If the voter doesn't have enough tokens for voting, deposit more
            if (voteTokenBalance[voter] < numTokens) {
                uint remainder = numTokens.sub(voteTokenBalance[voter]);
                depositVoteTokens(remainder);
            }
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
     @param resources The contests to vote on
     @param firstChoices The corresponding first choices
     @param secondChoices The corresponding second choices
     @param salt The salt used to generate the original commitment
     */
    function revealBallot(
        uint256 epochNumber,
        address voter,
        address[] memory resources,
        uint[] memory firstChoices,
        uint[] memory secondChoices,
        uint salt
    ) public {
        uint256 epochTime = now.sub(epochStart(epochNumber));
        require(
            (REVEAL_PERIOD_START <= epochTime) && (epochTime < EPOCH_LENGTH),
            "Reveal period not active"
        );

        require(voter != address(0), "Voter address cannot be zero");
        require(resources.length == firstChoices.length, "All inputs must have the same length");
        require(firstChoices.length == secondChoices.length, "All inputs must have the same length");

        uint256 ballotID = epochNumber;
        require(didCommit(ballotID, voter), "Voter has not committed for this ballot");
        require(didReveal(ballotID, voter) == false, "Voter has already revealed for this ballot");


        // calculate the hash
        bytes memory buf;
        uint votes = resources.length;
        for (uint i = 0; i < votes; i++) {
            buf = abi.encodePacked(
                buf,
                resources[i],
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
            address resource = resources[i];

            // get the contest for the current resource
            Contest storage contest = ballot.contests[resource];

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
        uint256 epochNumber,
        address[] memory _voters,
        bytes[] memory _ballots,
        uint[] memory _salts
    ) public {
        uint numBallots = _voters.length;

        for (uint i = 0; i < numBallots; i++) {
            // extract resources, firstChoices, secondChoices from the ballot
            (
                address[] memory resources,
                uint[] memory firstChoices,
                uint[] memory secondChoices
            ) = abi.decode(_ballots[i], (address[], uint[], uint[]));

            revealBallot(epochNumber, _voters[i], resources, firstChoices, secondChoices, _salts[i]);
        }
    }

    /**
     @dev Get the number of first-choice votes cast for the given slate and resource
     @param ballotID The ballot
     @param resource The resource
     @param slateID The slate
     */
    function getFirstChoiceVotes(uint ballotID, address resource, uint slateID) public view returns(uint) {
        SlateVotes storage v = ballots[ballotID].contests[resource].votes[slateID];
        return v.firstChoiceVotes;
    }

    /**
     @dev Get the number of second-choice votes cast for the given slate and resource
     @param ballotID The ballot
     @param resource The resource
     @param slateID The slate
     */
    function getSecondChoiceVotes(uint ballotID, address resource, uint slateID) public view returns(uint) {
        // for each option that isn't this one, get the second choice votes
        Contest storage contest = ballots[ballotID].contests[resource];
        uint numSlates = contest.stakedSlates.length;
        uint votes = 0;
        for (uint i = 0; i < numSlates; i++) {
            uint otherSlateID = contest.stakedSlates[i];
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
     @param resource The resource to count votes for
     */
    function countVotes(uint ballotID, address resource) public {
        // Make sure the ballot has a contest for this resource
        Contest storage contest = ballots[ballotID].contests[resource];
        require(contest.status == ContestStatus.Active || contest.status == ContestStatus.NoContest,
            "Either no contest is in progress for this resource, or it has been finalized");

        // Handle the case of a single staked slate in the contest -- it should automatically win
        // Finalization should be possible as soon as the slate submission period is over
        if (contest.status == ContestStatus.NoContest) {
            require(now > slateSubmissionDeadline(ballotID, resource), "Slate submission still active");

            uint256 winningSlate = contest.stakedSlates[0];
            assert(slates[winningSlate].status == SlateStatus.Staked);

            contest.winner = winningSlate;
            contest.status = ContestStatus.Finalized;

            acceptSlate(winningSlate);
            emit ContestAutomaticallyFinalized(ballotID, resource, winningSlate);
            return;
        }

        // Non-automatic finalization must be after the vote period (i.e when the given epoch
        // is over)
        require(currentEpochNumber() > ballotID, "Reveal period still active");

        // Iterate through the slates and get the one with the most votes
        uint winner = 0;
        uint winnerVotes = 0;
        uint runnerUp = 0;
        uint runnerUpVotes = 0;

        uint total = 0;
        bool noVotes = true;

        for (uint i = 0; i < contest.stakedSlates.length; i++) {
            uint slateID = contest.stakedSlates[i];
            assert(slates[slateID].status == SlateStatus.Staked);

            SlateVotes storage currentSlate = contest.votes[slateID];

            uint votes = currentSlate.firstChoiceVotes;
            if (noVotes && votes > 0) {
                noVotes = false;
            }
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

        // If no one voted, reject all participating slates
        if (noVotes) {
            // No more active slates
            uint256[] memory activeSlates = new uint256[](0);

            rejectSlates(contest.stakedSlates, activeSlates);
            contest.status = ContestStatus.Finalized;
            emit ContestFinalizedWithoutWinner(ballotID, resource);
            return;
        }

        // Update state
        contest.confidenceVoteWinner = winner;
        contest.confidenceVoteRunnerUp = runnerUp;
        emit ConfidenceVoteCounted(ballotID, resource, winner, winnerVotes, total);

        // If the winner has more than 50%, we are done
        // Otherwise, trigger a runoff
        if (winnerVotes.mul(2) > total) {
            contest.winner = winner;
            acceptSlate(winner);

            uint256[] memory activeSlates = new uint256[](1);
            activeSlates[0] = contest.winner;
            rejectSlates(contest.stakedSlates, activeSlates);

            contest.status = ContestStatus.Finalized;
            emit ConfidenceVoteFinalized(ballotID, resource, winner);
        } else {
            uint256[] memory activeSlates = new uint256[](2);
            activeSlates[0] = contest.confidenceVoteWinner;
            activeSlates[1] = contest.confidenceVoteRunnerUp;
            rejectSlates(contest.stakedSlates, activeSlates);

            contest.status = ContestStatus.RunoffPending;
            emit ConfidenceVoteFailed(ballotID, resource);
        }
    }

    /**
     @dev Return the status of the specified contest
     */
    function contestStatus(uint ballotID, address resource) public view returns(ContestStatus) {
        return ballots[ballotID].contests[resource].status;
    }

    /**
     @dev Return the IDs of the slates (staked and unstaked) associated with the contest
     */
    function contestSlates(uint ballotID, address resource) public view returns(uint[] memory) {
        return ballots[ballotID].contests[resource].slates;
    }


    /**
     @dev Get the details of the specified contest
     */
    function contestDetails(uint256 epochNumber, address resource) external view
        returns(
            ContestStatus status,
            uint256[] memory allSlates,
            uint256[] memory stakedSlates,
            uint256 lastStaked,
            uint256 confidenceVoteWinner,
            uint256 confidenceVoteRunnerUp,
            uint256 winner
        ) {
        Contest memory c =  ballots[epochNumber].contests[resource];

        status = c.status;
        allSlates = c.slates;
        stakedSlates = c.stakedSlates;
        lastStaked = c.lastStaked;
        confidenceVoteWinner = c.confidenceVoteWinner;
        confidenceVoteRunnerUp = c.confidenceVoteRunnerUp;
        winner = c.winner;
    }

    /**
     @dev Trigger a runoff count and update the status of the contest

     Revert if a runoff is not pending.
     Eliminate all slates but the top two from the confidence vote. Re-count, including the
     second-choice votes for the top two slates. The slate with the most votes wins. In case
     of a tie, the earliest slate submitted (slate with the lowest ID) wins.

     @param ballotID The ballot
     @param resource The resource to count votes for
     */
    function countRunoffVotes(uint ballotID, address resource) public {
        Contest memory contest = ballots[ballotID].contests[resource];
        require(contest.status == ContestStatus.RunoffPending, "Runoff is not pending");

        uint confidenceVoteWinner = contest.confidenceVoteWinner;
        uint confidenceVoteRunnerUp = contest.confidenceVoteRunnerUp;

        emit RunoffStarted(ballotID, resource, confidenceVoteWinner, confidenceVoteRunnerUp);

        // Get the number of first-choice votes for the top choices
        uint confidenceWinnerVotes = getFirstChoiceVotes(ballotID, resource, confidenceVoteWinner);
        uint confidenceRunnerUpVotes = getFirstChoiceVotes(ballotID, resource, confidenceVoteRunnerUp);

        // For slates other than the winner and leader,
        // count second-choice votes for the top two slates
        for (uint i = 0; i < contest.stakedSlates.length; i++) {
            uint slateID = contest.stakedSlates[i];
            if (slateID != confidenceVoteWinner && slateID != confidenceVoteRunnerUp) {
                // count second-choice votes for the top two slates
                SlateVotes storage currentSlate = ballots[ballotID].contests[resource].votes[slateID];

                // Second-choice votes for the winning slate
                uint votesForWinner = currentSlate.secondChoiceVotes[confidenceVoteWinner];
                confidenceWinnerVotes = confidenceWinnerVotes.add(votesForWinner);

                // Second-choice votes for the runner-up slate
                uint votesForRunnerUp = currentSlate.secondChoiceVotes[confidenceVoteRunnerUp];
                confidenceRunnerUpVotes = confidenceRunnerUpVotes.add(votesForRunnerUp);
            }
        }

        // Tally for the runoff
        uint runoffWinner = 0;
        uint runoffWinnerVotes = 0;
        uint runoffLoser = 0;
        uint runoffLoserVotes = 0;

        // Original winner has more votes, or it's tied and the original winner has a smaller ID
        if ((confidenceWinnerVotes > confidenceRunnerUpVotes) ||
           ((confidenceWinnerVotes == confidenceRunnerUpVotes) &&
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
        emit RunoffCounted(ballotID, resource, runoffWinner, runoffWinnerVotes, runoffLoser, runoffLoserVotes);

        // Update state
        Contest storage updatedContest = ballots[ballotID].contests[resource];
        updatedContest.winner = runoffWinner;
        updatedContest.status = ContestStatus.Finalized;
        acceptSlate(runoffWinner);

        // Reject the losing slate
        slates[runoffLoser].status = SlateStatus.Rejected;

        emit RunoffFinalized(ballotID, resource, runoffWinner);
    }


    /**
     @dev Send tokens of the rejected slates to the token capacitor.
     @param ballotID The ballot
     @param resource The resource
     */
    function donateChallengerStakes(uint256 ballotID, address resource) public {
        Contest memory contest = ballots[ballotID].contests[resource];
        require(contest.status == ContestStatus.Finalized, "Contest is not finalized");

        address tokenCapacitorAddress = parameters.getAsAddress("tokenCapacitorAddress");
        TokenCapacitor capacitor = TokenCapacitor(tokenCapacitorAddress);
        IERC20 token = token();
        bytes memory stakeDonationHash = "Qmepxeh4KVkyHYgt3vTjmodB5RKZgUEmdohBZ37oKXCUCm";

        uint256 numSlates = contest.stakedSlates.length;
        for (uint256 i = 0; i < numSlates; i++) {
            uint256 slateID = contest.stakedSlates[i];
            Slate storage slate = slates[slateID];
            if (slate.status == SlateStatus.Rejected) {
                uint256 donationAmount = slate.stake;
                slate.stake = 0;

                // Only donate for non-zero amounts
                if (donationAmount > 0) {
                    require(
                        token.approve(address(capacitor), donationAmount),
                        "Failed to approve Gatekeeper to spend tokens"
                    );
                    capacitor.donate(address(this), donationAmount, stakeDonationHash);
                }
            }
        }
    }

    /**
    @dev Mark slates as rejected, except for those in _exclude
     */
    function rejectSlates(uint256[] memory _slates, uint256[] memory _exclude) private {
        uint256 numSlates = _slates.length;
        uint256 excludeCount = _exclude.length;

        for (uint i = 0; i < numSlates; i++) {
            uint slateID = _slates[i];

            bool isExcluded = false;
            for (uint j = 0; j < excludeCount; j++) {
                if (_exclude[j] == slateID) {
                    isExcluded = true;
                    break;
                }
            }

            if (!isExcluded) {
                slates[slateID].status = SlateStatus.Rejected;
            }
        }
    }

    /**
     @dev Return the ID of the winning slate for the given ballot and resource
     Revert if the vote has not been finalized yet.
     @param ballotID The ballot of interest
     @param resource The resource of interest
     */
    function getWinningSlate(uint ballotID, address resource) public view returns(uint) {
        Contest storage c = ballots[ballotID].contests[resource];
        require(c.status == ContestStatus.Finalized, "Vote is not finalized yet");

        return c.winner;
    }


    // ACCESS CONTROL
    /**
    @dev Request permission to perform the action described in the metadataHash
    @param metadataHash A reference to metadata about the action
    */
    function requestPermission(bytes memory metadataHash) public returns(uint) {
        require(metadataHash.length > 0, "metadataHash cannot be empty");
        address resource = msg.sender;

        // If the request is created in epoch n, expire at the start of epoch n + 2
        uint256 expirationTime = epochStart(currentEpochNumber().add(2));

        // Create new request
        Request memory r = Request({
            metadataHash: metadataHash,
            resource: resource,
            approved: false,
            expirationTime: expirationTime
        });

        // Record request and return its ID
        uint requestID = requestCount;
        requests[requestID] = r;
        requestCount = requestCount.add(1);

        emit PermissionRequested(resource, requestID, metadataHash);
        return requestID;
    }

    /**
    @dev Update a slate and its associated requests
    @param slateID The slate to update
     */
    function acceptSlate(uint slateID) private {
        // Mark the slate as accepted
        Slate storage s = slates[slateID];
        s.status = SlateStatus.Accepted;

        // Record the incumbent
        if (incumbent[s.resource] != s.recommender) {
            incumbent[s.resource] = s.recommender;
        }

        // mark all of its requests as approved
        uint[] memory requestIDs = s.requests;
        for (uint i = 0; i < requestIDs.length; i++) {
            uint requestID = requestIDs[i];
            requests[requestID].approved = true;
        }
    }

    /**
    @dev Return true if the requestID has been approved via slate governance and has not expired
    @param requestID The ID of the request to check
     */
    function hasPermission(uint requestID) public view returns(bool) {
        return requests[requestID].approved && now < requests[requestID].expirationTime;
    }


    // MISCELLANEOUS GETTERS
    function token() public view returns(IERC20) {
        return IERC20(parameters.getAsAddress("tokenAddress"));
    }

    /**
    @dev Return the slate submission deadline for the given resource
    @param epochNumber The epoch
    @param resource The resource
     */
    function slateSubmissionDeadline(uint256 epochNumber, address resource) public view returns(uint256) {
        Contest memory contest = ballots[epochNumber].contests[resource];
        uint256 offset = (contest.lastStaked.add(COMMIT_PERIOD_START)).div(2);

        return epochStart(epochNumber).add(offset);
    }

    /**
    @dev Return true if the commit period is active for the current epoch
     */
    function commitPeriodActive() private view returns(bool) {
        uint256 epochTime = now.sub(epochStart(currentEpochNumber()));
        return (COMMIT_PERIOD_START <= epochTime) && (epochTime < REVEAL_PERIOD_START);
    }
}
