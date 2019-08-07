pragma solidity 0.5.10;
pragma experimental ABIEncoderV2;

import "./Gatekeeper.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract ParameterStore {
    // EVENTS
    event ProposalCreated(
        uint256 proposalID,
        address indexed proposer,
        uint256 requestID,
        string key,
        bytes32 value,
        bytes metadataHash
    );
    event Initialized();
    event ParameterSet(string name, bytes32 key, bytes32 value);
    event ProposalAccepted(uint256 proposalID, string key, bytes32 value);


    // STATE
    using SafeMath for uint256;

    address owner;
    bool public initialized;
    mapping(bytes32 => bytes32) public params;

    // A proposal to change a value
    struct Proposal {
        address gatekeeper;
        uint256 requestID;
        string key;
        bytes32 value;
        bytes metadataHash;
        bool executed;
    }

    // All submitted proposals
    Proposal[] public proposals;

    // IMPLEMENTATION
    /**
     @dev Initialize a ParameterStore with a set of names and associated values.
     @param _names Names of parameters
     @param _values abi-encoded values to assign them
    */
    constructor(string[] memory _names, bytes32[] memory _values) public {
        owner = msg.sender;
        require(_names.length == _values.length, "All inputs must have the same length");

        for (uint i = 0; i < _names.length; i++) {
            string memory name = _names[i];
            set(name, _values[i]);
        }
    }

    /**
     @dev Initialize the contract, preventing any more changes not made through slate governance
     */
    function init() public {
        require(msg.sender == owner, "Only the owner can initialize the ParameterStore");
        require(initialized == false, "Contract has already been initialized");

        initialized = true;
        emit Initialized();
    }

    // GETTERS

    /**
     @dev Get the parameter value associated with the given name.
     @param _name The name of the parameter to get the value for
    */
    function get(string memory _name) public view returns (bytes32 value) {
        // TODO: what if the value doesn't exist?
        return params[keccak256(abi.encodePacked(_name))];
    }

    /**
     @dev Get the parameter value and cast to `uint256`
     @param _name The name of the parameter to get the value for
    */
    function getAsUint(string memory _name) public view returns(uint256) {
        bytes32 value = get(_name);
        return uint256(value);
    }

    /**
     @dev Get the parameter value and cast to `address`
     @param _name The name of the parameter to get the value for
    */
    function getAsAddress(string memory _name) public view returns (address) {
        bytes32 value = get(_name);
        return address(uint256(value));
    }

    // SETTERS
    /**
     @dev Assign the parameter with the given key to the given value.
     @param _name The name of the parameter to be set
     @param _value The abi-encoded value to assign the parameter
    */
    function set(string memory _name, bytes32 _value) private {
        bytes32 key = keccak256(abi.encodePacked(_name));
        params[key] = _value;
        emit ParameterSet(_name, key, _value);
    }

    /**
     @dev Set a parameter before the ParameterStore has been initialized
     @param _name The name of the parameter to set
     @param _value The abi-encoded value to assign the parameter
    */
    function setInitialValue(string memory _name, bytes32 _value) public {
        require(msg.sender == owner, "Only the owner can set initial values");
        require(initialized == false, "Cannot set values after initialization");

        set(_name, _value);
    }

    function _createProposal(Gatekeeper gatekeeper, string memory key, bytes32 value, bytes memory metadataHash) internal returns(uint256) {
        Proposal memory p = Proposal({
            gatekeeper: address(gatekeeper),
            requestID: 0,
            key: key,
            value: value,
            metadataHash: metadataHash,
            executed: false
        });

        // Request permission from the Gatekeeper and store the proposal data for later.
        // If the request is approved, a user can execute the proposal by providing the
        // proposalID.
        uint requestID = gatekeeper.requestPermission(metadataHash);
        p.requestID = requestID;
        uint proposalID = proposalCount();
        proposals.push(p);

        emit ProposalCreated(proposalID, msg.sender, requestID, key, value, metadataHash);
        return proposalID;
    }

    /**
     @dev Create a proposal to set a value.
     @param key The key to set
     @param value The value to set
     @param metadataHash A reference to metadata describing the proposal
     */
    function createProposal(string calldata key, bytes32 value, bytes calldata metadataHash) external returns(uint256) {
        require(metadataHash.length > 0, "metadataHash cannot be empty");
        require(initialized, "Contract has not yet been initialized");

        Gatekeeper gatekeeper = _gatekeeper();
        return _createProposal(gatekeeper, key, value, metadataHash);
    }

    /**
     @dev Create multiple proposals to set values.
     @param keys The keys to set
     @param values The values to set for the keys
     @param metadataHashes Metadata hashes describing the proposals
    */
    function createManyProposals(
        string[] calldata keys,
        bytes32[] calldata values,
        bytes[] calldata metadataHashes
    ) external {
        require(
            keys.length == values.length && values.length == metadataHashes.length,
            "All inputs must have the same length"
        );

        Gatekeeper gatekeeper = _gatekeeper();
        for (uint i = 0; i < keys.length; i++) {
            string memory key = keys[i];
            bytes32 value = values[i];
            bytes memory metadataHash = metadataHashes[i];
            _createProposal(gatekeeper, key, value, metadataHash);
        }
    }

    /**
     @dev Execute a proposal to set a parameter. The proposal must have been included in an
     accepted governance slate.
     @param proposalID The proposal
     */
    function setValue(uint256 proposalID) public returns(bool) {
        require(proposalID < proposalCount(), "Invalid proposalID");
        require(initialized, "Contract has not yet been initialized");

        Proposal memory p = proposals[proposalID];
        Gatekeeper gatekeeper = Gatekeeper(p.gatekeeper);

        require(gatekeeper.hasPermission(p.requestID), "Proposal has not been approved");
        require(p.executed == false, "Proposal already executed");

        proposals[proposalID].executed = true;

        set(p.key, p.value);

        emit ProposalAccepted(proposalID, p.key, p.value);
        return true;
    }

    function proposalCount() public view returns(uint256) {
        return proposals.length;
    }

    function _gatekeeper() private view returns(Gatekeeper) {
        address gatekeeperAddress = getAsAddress("gatekeeperAddress");
        require(gatekeeperAddress != address(0), "Missing gatekeeper");
        return Gatekeeper(gatekeeperAddress);
    }
}
