const ethers = require('ethers');

const {
  contractABIs: { ParameterStore },
} = require('../../packages/panvala-utils');

const { getContracts } = require('../utils/eth');
const { Request } = require('../models');

run();

async function run() {
  const { signer, gatekeeper } = getContracts();
  const psAddress = await gatekeeper.functions.parameters();
  const parameters = new ethers.Contract(psAddress, ParameterStore.abi, signer);

  // current epoch
  const epochNumber = await gatekeeper.functions.currentEpochNumber();

  let winningSlate;
  try {
  // get the winning slate of the previous epoch
    winningSlate = await gatekeeper.functions.getWinningSlate(epochNumber.sub(1), psAddress);
  } catch (error) {
    console.error(error);
  }

  // get the winning slate requests
  const slateRequests = await gatekeeper.functions.slateRequests(winningSlate);

  try {
    // loop the winning slate requests, call setValue if it's not executed
    await Promise.all(
      slateRequests.map(async requestID => {
        // get the Request
        const request = await Request.findOne({
          where: {
            requestID: requestID.toString(),
          },
          raw: true,
        });

        const proposal = await parameters.functions.proposals(request.proposalID);

        // check if already executed
        if (proposal.executed) {
          console.log('proposal already executed');
        } else {
          console.log('setting value for proposal', request.proposalID);
          await parameters.functions.setValue(request.proposalID);
        }
      })
    );

    console.log('DONE');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
