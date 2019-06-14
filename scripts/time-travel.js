const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

const currentDir = path.resolve(__dirname);
const readDir = `${currentDir}/../governance-contracts/build/contracts`;
const Gatekeeper = JSON.parse(fs.readFileSync(`${readDir}/Gatekeeper.json`));

const gatekeeperAddress = process.env.GATEKEEPER_ADDRESS;

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

  const testProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const signer = testProvider.getSigner();
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, signer);

  await gatekeeper.functions.timeTravel(daysInSeconds);
}
