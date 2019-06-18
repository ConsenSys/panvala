const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

const currentDir = path.resolve(__dirname);
const readDir = `${currentDir}/../governance-contracts/build/contracts`;
const Gatekeeper = JSON.parse(fs.readFileSync(`${readDir}/Gatekeeper.json`));

const gatekeeperAddress = process.env.GATEKEEPER_ADDRESS;
const rpcEndpoint = process.env.RPC_ENDPOINT;

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
// travel forward or backwards in time based on number of days provided
async function timeTravel(days) {
  const daysInSeconds = days.mul(ONE_DAY);

  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const signer = provider.getSigner();
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);

  await gatekeeper.functions.timeTravel(daysInSeconds);
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
