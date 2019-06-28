# Panvala Permissions API
Using the Permissions API, you can create contracts that have functions that can only be executed through permission granted by the gatekeeper (and therefore, the larger Panvala community).

## General flow
A user makes a proposal, and the contract requests permission from the gatekeeper and stores the `requestID` it receives. The user gets back a `proposalID` to use to execute the proposal later. If the request is approved through being included in an accepted slate, the proposal is accepted. The user can now pass the `proposalID` to a function on the contract to execute the proposal. In that execution function, the contract checks whether the `requestID` associated with its `proposalID` has permission, and then executes the rest of the function if it has.

## Usage
Define proposals for your contract. Users of the contract will need to create proposals, including a metadata hash (e.g. IPFS CID) describing the nature of the proposal.

You can define your data structures any way you want, but it should contain the address of the current gatekeeper, as well as the `requestID` it received from requesting permission, the metadata hash submitted with the proposal, any data required to execute the proposal later, and some way to prevent the proposal from being executed twice.


Below are some examples from `ParameterStore.sol`
```
struct Proposal {
    // request identification
    address gatekeeper;
    uint256 requestID;
    // proposal data
    bytes metadataHash;
    string key;
    bytes32 value;
    // some way to prevent proposals from being executed twice
    bool executed;
}
```

Provide a function for submitting proposals. It should emit an event `ProposalCreated` and return `proposalID`.
```
event ProposalCreated(
    uint256 proposalID,
    address indexed proposer,
    uint256 requestID,
    // proposal data
    string key,
    bytes32 value,
    bytes metadataHash
);
```

```
function createProposal(string memory key, bytes32 value, bytes memory metadataHash) public returns(uint256) {
    require(metadataHash.length > 0, "metadataHash cannot be empty");

    Gatekeeper gatekeeper = _gatekeeper();
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
    uint proposalID = proposalCount;
    proposals[proposalID] = p;
    proposalCount = proposalCount.add(1);

    emit ProposalCreated(proposalID, msg.sender, requestID, key, value, metadataHash);
    return proposalID;
}
```

It's helpful to have a function to create many proposals at once.
```
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
```

Finally, execute the proposal. The execution function should emit an event including the `proposalID` and some data for context.
```
function setValue(uint256 proposalID) public returns(bool) {
    require(proposalID < proposalCount, "Invalid proposalID");

    Proposal memory p = proposals[proposalID];
    Gatekeeper gatekeeper = Gatekeeper(p.gatekeeper);

    require(gatekeeper.hasPermission(p.requestID), "Proposal has not been approved");
    require(p.executed == false, "Proposal already executed");

    proposals[proposalID].executed = true;

    set(p.key, p.value);

    emit ParameterSet(proposalID, p.key, p.value);
    return true;
}
```
