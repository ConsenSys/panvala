const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const readline = require('readline');


const currentDir = path.resolve(__dirname);
const readDir = `${currentDir}/../governance-contracts/build/contracts`;
const Gatekeeper = JSON.parse(fs.readFileSync(`${readDir}/Gatekeeper.json`));

const gatekeeperAddress = process.env.GATEKEEPER_ADDRESS;
const rpcEndpoint = process.env.RPC_ENDPOINT;
const mnemonic = process.env.MNEMONIC;

const ONE_DAY = 86400;
const BN = small => ethers.utils.bigNumberify(small);

// get input
const argv = process.argv;

// default 1 week forward
// node scripts/time-travel.js
let days = BN('7');

if (argv[2] === 'weeks' && argv[3]) {
  // specify number of weeks
  // node scripts/time-travel.js weeks [number]
  days = BN(argv[3]).mul(7);
} else if (argv[2]) {
  // specify number of days
  // node scripts/time-travel.js [number]
  days = BN(argv[2]);
}

timeTravel(days);


function getSigner(provider) {
  if (typeof mnemonic === 'undefined') {
    // default
    return provider.getSigner();
  } else {
    // use the mnemonic
    const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
    return new ethers.Wallet(mnemonicWallet.privateKey, provider);
  }
}

function toDate(ts) {
  const d = ethers.utils.bigNumberify(ts);
  return new Date(d.mul(1000).toNumber());
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// travel forward or backwards in time based on number of days provided
async function timeTravel(days) {
  const daysInSeconds = days.mul(ONE_DAY);

  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const signer = getSigner(provider);

  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);

  // Print timings
  const epoch = await gatekeeper.functions.currentEpochNumber();
  const epochStart = await gatekeeper.functions.epochStart(epoch);
  const now = Math.floor(new Date() / 1000);
  console.log(`Current epoch: ${epoch.toString()}`);
  console.log(`Epoch start: ${epochStart.toString()} -> ${toDate(epochStart)}`);
  console.log(`Current time: ${now} -> ${toDate(now)}`);
  console.log(`Epoch time: \n  ${(now - epochStart.toNumber()) / ONE_DAY} days`);
  console.log(`  ${(now - epochStart.toNumber()) / (ONE_DAY * 7)} weeks`);

  // Send the tx, with confirmation from the user
  rl.question(`Do you want to time travel ${days} days? [y/N]`, (answer) => {
    if (answer === 'y') {
      console.log('traveling');
      const receipt = await gatekeeper.functions.timeTravel(daysInSeconds);
      console.log(receipt);
    } else {
      console.log('exiting');
    }

    rl.close();
  });
}

// to travel forward one week:
// node scripts/time-travel.js

// to travel forward three days:
// node scripts/time-travel.js 3

// to travel backward three days:
// node scripts/time-travel.js -3

// to travel forward eleven weeks:
// node scripts/time-travel.js weeks 11

// to travel backward eleven weeks:
// node scripts/time-travel.js weeks -11
