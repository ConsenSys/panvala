pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


import "../Gatekeeper.sol";
import "../ParameterStore.sol";

/**
 @dev An example upgraded gatekeeper that copies over data on initialization

 For the epoch in which this gatekeeper is deployed, copy:
 startTime, requestCount, slateCount,
 contest details for token capacitor and parameter store,
 for each resource
   winning slate and its associated Requests
   incumbent
*/
contract UpgradedGatekeeper is Gatekeeper {
    Gatekeeper previousGatekeeper;
    bool initialized;
    uint256 epochToTransfer;

    constructor(ParameterStore _parameters)
        Gatekeeper(0, _parameters) public {

        // get the old gatekeeper
        address gatekeeperAddress = _parameters.getAsAddress("gatekeeperAddress");
        require(gatekeeperAddress != address(0), "Missing gatekeeper");

        previousGatekeeper = Gatekeeper(gatekeeperAddress);

        // Assume that this gatekeeper is deployed in the same epoch as the one in which
        // the upgrade proposal is made
        epochToTransfer = previousGatekeeper.currentEpochNumber();

        // Keep the same start time
        startTime = previousGatekeeper.startTime();
    }

    function init() public {
        require(initialized == false, "Already initialized");

        // Do not allow initialization until this gatekeeper has been accepted
        address gatekeeperAddress = parameters.getAsAddress("gatekeeperAddress");
        require(gatekeeperAddress == address(this), "Not ready");

        migrateState();

        initialized = true;
    }

    // Functions frozen before initialization
    function depositVoteTokens(uint numTokens) public returns(bool) {
        require(initialized == true, "Not initialized");
        return super.depositVoteTokens(numTokens);
    }

    function stakeTokens(uint256 slateID) public returns(bool) {
        require(initialized == true, "Not initialized");
        return super.stakeTokens(slateID);
    }

    /**
     @dev Migrate state from the previous gatekeeper
     */
    function migrateState() private {
        // Continue from where the previous one left off
        // Note that some of the slates and requests will be uninitialized
        // If you were to use this pattern, then you would need to make sure to get the slates from
        // the appropriate gatekeepers
        slateCount = previousGatekeeper.slateCount();
        requestCount = previousGatekeeper.requestCount();

        // Handle contests we care about
        address capacitor = parameters.getAsAddress("tokenCapacitorAddress");
        migrateContest(epochToTransfer, capacitor);
        migrateContest(epochToTransfer, address(parameters));
    }

    function migrateContest(uint256 epochNumber, address resource) private {
        // contest
        Contest memory importedContest = fetchContest(epochNumber, resource);
        ballots[epochNumber].contests[resource] = importedContest;

        // winning slate and its reqeusts
        Slate memory winningSlate = fetchSlate(importedContest.winner);
        slates[importedContest.winner] = winningSlate;

        uint256 numRequests = winningSlate.requests.length;
        for (uint256 i = 0; i < numRequests; i++) {
           uint256 requestID = winningSlate.requests[i];
           (
               bytes memory metadataHash,
               address _resource,
               bool approved,
               uint256 expirationTime
           ) = previousGatekeeper.requests(requestID);

           requests[requestID] = Request({
               metadataHash: metadataHash,
               resource: _resource,
               approved: approved,
               expirationTime: expirationTime
           });
        }

        // incumbent
        incumbent[resource] = previousGatekeeper.incumbent(resource);
    }

    function fetchContest(uint256 epochNumber, address resource) private view returns(Contest memory) {
        previousGatekeeper.contestDetails(epochNumber, resource);
        (
            ContestStatus status,
            uint256[] memory allSlates,
            uint256[] memory stakedSlates,
            uint256 lastStaked,
            uint256 confidenceVoteWinner,
            uint256 confidenceVoteRunnerUp,
            uint256 winner
        ) = previousGatekeeper.contestDetails(epochNumber, resource);

        Contest memory importedContest = Contest({
            status: status,
            slates: allSlates,
            stakedSlates: stakedSlates,
            lastStaked: lastStaked,
            confidenceVoteWinner: confidenceVoteWinner,
            confidenceVoteRunnerUp: confidenceVoteRunnerUp,
            winner: winner
        });

        return importedContest;
    }

    function fetchSlate(uint256 slateID) private view returns(Slate memory) {
        (
            address recommender,
            bytes memory metadataHash,
            SlateStatus slateStatus,
            address staker,
            uint stake,
            uint256 slateEpochNumber,
            address slateResource
        ) = previousGatekeeper.slates(slateID);
        uint[] memory _requests = previousGatekeeper.slateRequests(slateID);

        Slate memory importedSlate = Slate({
            recommender: recommender,
            metadataHash: metadataHash,
            requests: _requests,
            status: slateStatus,
            staker: staker,
            stake: stake,
            epochNumber: slateEpochNumber,
            resource: slateResource
        });

        return importedSlate;
    }
}
