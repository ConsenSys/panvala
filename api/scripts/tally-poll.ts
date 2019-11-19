import { Contract } from 'ethers';
import { BigNumber, bigNumberify, formatUnits, commify } from 'ethers/utils';
import * as yargs from 'yargs';

import { responseCount, getPollByID, getCategories } from '../src/utils/polls';
import { getContracts, contractABIs, checkConnection } from '../src/utils/eth';

const { CategoryPollResponse, CategoryPollAllocation } = require('../src/models');

function prettyToken(amount: BigNumber) {
  return commify(formatUnits(amount.toString(), 18));
}

interface Tally {
  total: BigNumber;
  nonZeroResponses: number;
}

async function run() {
  // Parse arguments
  const argv = yargs
    .scriptName('tally-poll')
    .default('pollID', 1)
    .help().argv;

  const pollID: number = argv.pollID;
  if (typeof pollID !== 'number') {
    console.error('pollID must be a number');
    process.exit(1);
  }

  // connect
  const { provider, gatekeeper, network } = await getContracts();
  const blockNumber = await checkConnection();
  console.log(`We are on network ${network.chainId}, block number ${blockNumber}`);

  const tokenAddress = await gatekeeper.token();
  const token = new Contract(tokenAddress, contractABIs.BasicToken.abi, provider);
  console.log('Token at', token.address);

  console.log('Tallying votes for poll', pollID);

  const responses = await CategoryPollResponse.findAll({
    where: { pollID },
    include: [{ model: CategoryPollAllocation, as: 'allocations' }],
  });
  // console.log(responses);

  const data = await Promise.all(
    responses.map(async response => {
      const plainResponse = await response.get({ plain: true });
      // console.log(plainResponse);
      return token.balanceOf(response.account).then(balance => {
        return { ...plainResponse, balance, prettyBalance: prettyToken(balance) };
      });
    })
  );
  // console.log(data);

  const initialTotal: Tally = {
    total: bigNumberify(0),
    nonZeroResponses: 0,
  };

  const tally: any = data.reduce((previous: Tally, current: any): Tally => {
    const updated = Object.assign({}, previous);
    const { account, balance, allocations } = current;

    console.log('tallying', account, allocations.length);
    console.log('balance', prettyToken(balance));

    current.allocations.forEach(allocation => {
      const { categoryID, points } = allocation;

      const weightedPoints = balance.mul(points);
      // console.log(allocation);
      const currentPoints: BigNumber = updated[categoryID];
      if (currentPoints != null) {
        updated[categoryID] = currentPoints.add(weightedPoints);
      } else {
        updated[categoryID] = weightedPoints;
      }
      console.log(
        `> points for ${categoryID}: ${points} (${prettyToken(weightedPoints)}) -> ${prettyToken(
          updated[categoryID]
        )}`
      );
    });
    console.log();

    const { nonZeroResponses, total } = previous;
    const updatedNonZeroResponses = balance.gt(0) ? nonZeroResponses + 1 : nonZeroResponses;
    return { ...updated, total: total.add(balance), nonZeroResponses: updatedNonZeroResponses };
  }, initialTotal);
  const displayTotal = commify(formatUnits(tally.total.toString(), 18));

  const count = await responseCount(pollID);

  const finalTally = {
    ...tally,
    count,
    displayTotal,
    weightedTotal: tally.total.mul(100),
  };

  const categoryKeys = Object.keys(finalTally).filter(key => parseInt(key));

  // Get the category details
  const categories = await getCategories().then(cats => {
    return cats.reduce((previous, current) => {
      previous[current.id] = current;
      return previous;
    }, {});
  });

  // Display results
  const poll = await getPollByID(pollID);
  if (poll == null) {
    console.log(`Poll with ID ${pollID} was not found`);
    process.exit(0);
  }

  console.log(finalTally);

  console.log();
  console.log('='.repeat(80));
  console.log(`Results for poll ${pollID} - "${poll.name}":`);
  console.log(new Date());
  console.log(`${count} responses received`);
  console.log(`${finalTally.nonZeroResponses} with nonzero balance`);
  console.log(`total weight ${displayTotal} PAN`);

  // Display table
  categoryKeys.forEach(async key => {
    const categoryID = parseInt(key);

    if (!Number.isNaN(categoryID)) {
      const weight: BigNumber = finalTally[key];
      const category = categories[key];
      const percentage = weight.mul(100).div(finalTally.weightedTotal);
      console.log(`${key}\t${category.displayName}\t${prettyToken(weight)} (${percentage}%)`);
    }
  });

  process.exit(0);
}

run();
