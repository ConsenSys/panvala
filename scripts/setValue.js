const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

const readDir = path.resolve(__dirname, '../governance-contracts/build/contracts');
const ParameterStore = JSON.parse(fs.readFileSync(`${readDir}/ParameterStore.json`));
const Gatekeeper = JSON.parse(fs.readFileSync(`${readDir}/Gatekeeper.json`));

const psAddress = process.env.PARAMETER_STORE_ADDRESS;
const gatekeeperAddress = process.env.GATEKEEPER_ADDRESS;
const rpcEndpoint = process.env.RPC_ENDPOINT;

run();

async function run() {
  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const signer = provider.getSigner();

  // get gatekeeper
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);
  const epochNumber = await gatekeeper.functions.currentEpochNumber();
  // get the winning slate of the previous epoch
  const winningSlate = await gatekeeper.functions.getWinningSlate(epochNumber.sub(1), psAddress);
  // get the winning slate requests
  const slateRequests = await gatekeeper.slateRequests(winningSlate);

  // get parameter store
  const parameters = new ethers.Contract(psAddress, ParameterStore.abi, signer);

  // loop the winning slate requests, call setValue if it's not executed
  await Promise.all(
    slateRequests.map(async requestID => {
      // get the Request
      const proposalID = await parameters.functions.requestProposals(requestID);
      const proposal = await parameters.functions.proposals(proposalID);

      if (proposal.executed) {
        console.log('proposal already executed');
      } else {
        await parameters.functions.setValue(proposalID);
      }
    })
  );

  console.log('DONE');
}
