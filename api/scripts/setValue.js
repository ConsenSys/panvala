const ethers = require('ethers');

const {
  contractABIs: { ParameterStore },
} = require('../../packages/panvala-utils');

const { getContracts } = require('../utils/eth');
const { Request } = require('../models');

const mnemonic = process.env.MNEMONIC;

run();

async function run() {
  const { provider, gatekeeper } = getContracts();
  const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const signer = new ethers.Wallet(mnemonicWallet.privateKey, provider);

  // Settings
  const psAddress = await gatekeeper.parameters();
  const parameters = new ethers.Contract(psAddress, ParameterStore.abi, signer);
  const epochNumber = await gatekeeper.currentEpochNumber();

  // Winning slate of previous epoch
  let winningSlate;
  try {
    winningSlate = await gatekeeper.getWinningSlate(epochNumber.sub(1), psAddress);
  } catch (error) {
    console.error('Contest not finalized yet. Exiting.');
    process.exit(0);
  }

  // Winning slate requests
  const slateRequests = await gatekeeper.slateRequests(winningSlate);

  // call setValue if slate request has not been executed
  await Promise.all(
    slateRequests.map(async requestID => {
      try {
        // From db
        const request = await Request.findOne({
          where: {
            requestID: requestID.toString(),
          },
          raw: true,
        });

        // Find matching on-chain proposal
        const proposal = await parameters.proposals(request.proposalID);

        // Ignore if executed
        if (proposal.executed) {
          console.log('proposal already executed');
        } else {
          console.log('setting value for proposal', request.proposalID);
          await parameters.functions.setValue(request.proposalID);
        }
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    })
  );

  // Success
  console.log('DONE');
  process.exit(0);
}
