pragma solidity ^0.5.0;


contract Slate {
    // EVENTS
    event Staked();
    event Rejected();
    event Accepted();

    // Possible states for a Slate
    enum Status {
        // Has not been staked on yet
        Unstaked,
        // Has been staked on
        Staked,
        // Was rejected through a vote
        Rejected,
        // Was accepted through no contest or through a vote
        Accepted
    }

    // The account that created the slate (the Gatekeeper)
    address public owner;

    // The account that recommended this slate
    address public recommender;

    // Metadata about the slate
    bytes public metadataHash;

    // Requests included in the slate
    mapping(uint => bool) public requestIncluded;
    uint[] _requests;

    // The current status of the slate
    Status public status;

    // Staking info
    address public staker;
    uint public stake;

    /**
     @dev Initialize a new Slate.
     @param _recommender The account that created the slate
     @param _metadataHash A reference to metadata about the slate
     @param _requestIDs Requests to be granted if the slate is accepted
    */
    constructor(
        address _recommender,
        bytes memory _metadataHash,
        uint[] memory _requestIDs
    )
        public
    {
        require(_recommender != address(0), "Recommender cannot be the zero address");
        require(_metadataHash.length > 0, "Metadata hash cannot be empty");

        owner = msg.sender;
        recommender = _recommender;
        metadataHash = _metadataHash;

        for (uint i = 0; i < _requestIDs.length; i++) {
            uint requestID = _requestIDs[i];
            require(requestIncluded[requestID] == false, "Request has already been added to slate");

            _requests.push(requestID);
            requestIncluded[requestID] = true;
        }

        status = Status.Unstaked;
    }

    /**
    @dev Return the requestIDs included in this slate
     */
    function getRequests() public view returns(uint[] memory) {
        return _requests;
    }

    /**
    @dev Mark this slate as accepted through slate governance
     */
    function markAccepted() external returns(bool) {
        require(msg.sender == owner, "Only owning account can mark the slate as accepted");

        status = Status.Accepted;
        emit Accepted();
        return true;
    }

    /**
    @dev Mark this slate as rejected through slate governance
     */
    function markRejected() external returns(bool) {
        require(msg.sender == owner, "Only the owning account can mark the slate as rejected");

        status = Status.Rejected;
        emit Rejected();
        return true;
    }


    /**
    @dev Mark this slate as having been staked on
    @param _staker The account staking on the slate
    @param _numTokens The number of tokens staked
     */
    function markStaked(address _staker, uint _numTokens) external returns(bool) {
        require(msg.sender == owner, "Only the owning account can mark the slate as staked");
        require(status == Status.Unstaked, "Slate has already been staked on");

        staker = _staker;
        stake = _numTokens;
        status = Status.Staked;
        emit Staked();
        return true;
    }

    function isStaked() public view returns(bool) {
        return status == Status.Staked;
    }
}
