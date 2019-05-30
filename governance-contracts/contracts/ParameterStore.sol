pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Gatekeeper.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract ParameterStore {
    // EVENTS
    event ParameterSet(bytes32 key, bytes32 value);
    event ProposalCreated(
        address indexed proposer,
        uint256 requestID,
        string key,
        bytes32 value,
        bytes metadataHash
    );

    // STATE
    using SafeMath for uint256;

    address owner;
    bool initialized;
    mapping(bytes32 => bytes32) public params;

    // A proposal to change a value
    struct Proposal {
        string key;
        bytes32 value;
        bytes metadataHash;
        bool executed;
    }

    mapping(uint => Proposal) public proposals;

    // The total number of proposals
    uint public proposalCount;

    // IMPLEMENTATION
    /**
     @dev Initialize a ParameterStore with a set of names and associated values.
     @param _names Names of parameters
     @param _values abi-encoded values to assign them
    */
    constructor(string[] memory _names, bytes32[] memory _values) public {
        owner = msg.sender;
        // NOTE: _keys and _values must have the same length

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
        require(initialized == false, "Contract has already been initalized");

        initialized = true;
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
        emit ParameterSet(key, _value);
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

    /**
     @dev Create a proposal to set a value.
     @param key The key to set
     @param value The value to set
     @param metadataHash A reference to metadata describing the proposal
     */
    function createProposal(string memory key, bytes32 value, bytes memory metadataHash) public returns(uint256) {
        require(metadataHash.length > 0, "metadataHash cannot be empty");

        Proposal memory p = Proposal({
            key: key,
            value: value,
            metadataHash: metadataHash,
            executed: false
        });

        // Request permission from the Gatekeeper and store the proposal data for later.
        // If the request is approved, a user can execute the proposal by providing the
        // requestID.
        uint requestID = _gatekeeper().requestPermission(metadataHash);
        proposals[requestID] = p;
        proposalCount = proposalCount.add(1);

        emit ProposalCreated(msg.sender, requestID, key, value, metadataHash);
        return requestID;
    }

    /**
     @dev Create multiple proposals to set values.
     @param keys The keys to set
     @param values The values to set for the keys
     @param metadataHashes Metadata hashes describing the proposals
    */
    function createManyProposals(
        string[] memory keys,
        bytes32[] memory values,
        bytes[] memory metadataHashes
    ) public {
        require(keys.length == values.length, "All inputs must have the same length");
        require(values.length == metadataHashes.length, "All inputs must have the same length");

        for (uint i = 0; i < keys.length; i++) {
            string memory key = keys[i];
            bytes32 value = values[i];
            bytes memory metadataHash = metadataHashes[i];
            createProposal(key, value, metadataHash);
        }
    }
    function _gatekeeper() private view returns(Gatekeeper) {
        address gatekeeperAddress = getAsAddress("gatekeeperAddress");
        require(gatekeeperAddress != address(0), "Missing gatekeeper");
        return Gatekeeper(gatekeeperAddress);
    }
}
