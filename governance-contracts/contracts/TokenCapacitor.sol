pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Gatekeeper.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract TokenCapacitor {
    // EVENTS
    event ProposalCreated(
        address indexed proposer,
        uint indexed requestID,
        address indexed to,
        uint tokens,
        bytes metadataHash
    );

    // STATE
    using SafeMath for uint;

    // The address of the associated Gatekeeper contract
    Gatekeeper public gatekeeper;

    struct Proposal {
        uint tokens;
        address to;
        bytes metadataHash;
        bool approved;
    }

    // The proposals created for the TokenCapacitor. Maps requestIDs to proposals.
    mapping(uint => Proposal) public proposals;

    // The total number of proposals
    uint public proposalCount;

    // IMPLEMENTATION
    constructor(Gatekeeper _gatekeeper) public {
        gatekeeper = _gatekeeper;
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
            approved: false
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
}
