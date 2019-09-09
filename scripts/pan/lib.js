const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const ipfsClient = require('ipfs-http-client');

const currentDir = path.resolve(__dirname);
const readDir = `${currentDir}/../../packages/panvala-utils/abis`;
const Gatekeeper = JSON.parse(fs.readFileSync(`${readDir}/Gatekeeper.json`));
// const BasicToken = JSON.parse(fs.readFileSync(`${readDir}/BasicToken.json`));
const TokenCapacitor = JSON.parse(fs.readFileSync(`${readDir}/TokenCapacitor.json`));
const ParameterStore = JSON.parse(fs.readFileSync(`${readDir}/ParameterStore.json`));

// default to mainnet contracts
const gatekeeperAddress =
  process.env.GATEKEEPER_ADDRESS || '0x21C3FAc9b5bF2738909C32ce8e086C2A5e6F5711';
const tokenCapacitorAddress =
  process.env.TOKEN_CAPACITOR_ADDRESS || '0x9a7B675619d3633304134155c6c976E9b4c1cfB3';
const rpcEndpoint = process.env.RPC_ENDPOINT;

async function prepareContracts() {
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);

  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, provider);
  const tokenCapacitor = new ethers.Contract(tokenCapacitorAddress, TokenCapacitor.abi, provider);
  const parameterStoreAddress = await gatekeeper.parameters();
  const parameterStore = new ethers.Contract(parameterStoreAddress, ParameterStore.abi, provider);

  console.log('gatekeeper:', gatekeeper.address);
  console.log('tokenCapacitor:', tokenCapacitor.address);
  console.log('parameterStore:', parameterStore.address);

  return { gatekeeper, tokenCapacitor, parameterStore, provider };
}

async function assembleGrantSlate(provider, gatekeeper, tokenCapacitor, slate, slateID) {
  const requestIDs = await gatekeeper.slateRequests(slateID);
  // console.log(requestIDs);

  // get the proposal IDs
  // console.log('fetching proposals');
  const proposals = await fetchGrantProposals(provider, tokenCapacitor, requestIDs);
  // console.log('proposals', proposals);

  // get the metadata
  const proposalHashes = proposals.map(proposal => proposal.metadataHash);
  const hashes = [slate.metadataHash, ...proposalHashes];
  const metadata = await fetchMetadata(hashes);
  // console.log(metadata);

  // combine everything
  const enrichedSlate = combineSlateData(slate, proposals, metadata);
  enrichedSlate.type = 'GRANT';
  console.log('SLATE', enrichedSlate);

  return enrichedSlate;
}

function combineSlateData(slate, proposals, metadata) {
  // console.log('metadata', metadata);
  const slateMetadata = metadata[slate.metadataHash];
  const enrichedSlate = {
    ...slate,
    metadata: slateMetadata,
  };

  const enrichedProposals = proposals.map(p => {
    return { ...p, metadata: metadata[p.metadataHash] };
  });

  return { ...enrichedSlate, proposals: enrichedProposals };
}

function decodeMultihash(multihash) {
  const hex = ethers.utils.hexlify(multihash);
  const stripped = hex.substring(2);
  const decoded = Buffer.from(stripped, 'hex');
  // console.log('decoded:', decoded.toString());
  return decoded.toString();
}

async function fetchMetadata(metadataHashes) {
  const metadataMap = {};
  const results = await Promise.all(
    metadataHashes.map(decodeMultihash).map(hash => ipfsGetData(hash))
  );

  results.forEach((data, i) => (metadataMap[metadataHashes[i]] = data));

  // console.log(results);
  return metadataMap;
}

const ipfs = new ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

async function ipfsGetData(multihash) {
  // if (ipfsCheckMultihash(multihash)) {
  return new Promise((resolve, reject) => {
    ipfs.cat(multihash, (err, result) => {
      if (err) reject(new Error(err));

      if (!result) {
        reject(new Error('Ipfs.get returned undefined.'));
      }
      const data = JSON.parse(result);
      resolve(data);
    });
  });
  // }
}

function tokenCapacitorGenesis(chainId) {
  if (chainId === '1') {
    return 8393666;
  }

  return 0;
}

async function fetchGrantProposals(provider, tokenCapacitor, requestIDs) {
  // filter for ProposalCreated events
  let interface = new ethers.utils.Interface(TokenCapacitor.abi);
  const fromBlock = tokenCapacitorGenesis(provider.network.chainId);

  const ProposalCreated = tokenCapacitor.interface.events.ProposalCreated;

  const filter = {
    address: tokenCapacitor.address,
    fromBlock,
    topics: [ProposalCreated.topic],
  };

  const inSlate = requestID => {
    let matched = false;
    const r = requestID.toString();

    for (let i = 0; i < requestIDs.length; i++) {
      const id = requestIDs[i];
      if (id.toString() === r) {
        matched = true;
        break;
      }
    }
    return matched;
  };

  const logs = await provider.getLogs(filter).then(rawLogs => {
    const parsed = rawLogs.map(log => interface.parseLog(log));
    // console.log(parsed);
    return parsed;
  });

  const proposalEvents = logs
    .map(log => {
      const { proposalID, proposer, requestID, recipient, tokens, metadataHash } = log.values;
      if (inSlate(requestID)) {
        return {
          proposalID,
          proposer,
          requestID,
          recipient,
          tokens,
          metadataHash,
        };
      } else {
        return null;
      }
    })
    .filter(p => p !== null);

  const getProposals = proposalEvents.map(p =>
    tokenCapacitor.proposals(p.proposalID).then(proposal => {
      const { gatekeeper, requestID, tokens, to, metadataHash, withdrawn } = proposal;
      return { gatekeeper, requestID, tokens, to, metadataHash, withdrawn };
    })
  );

  const proposals = await Promise.all(getProposals);
  // console.log(logs);
  return proposals;
}

async function fetchSlate(contracts, slateID) {
  const { gatekeeper } = contracts;
  const slate = await gatekeeper.slates(slateID);

  const requests = await gatekeeper.slateRequests(slateID);
  // console.log(requests);

  return slate;
}

module.exports = {
  prepareContracts,
  fetchSlate,
  assembleGrantSlate,
};
