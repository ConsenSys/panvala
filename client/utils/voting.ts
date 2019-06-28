import { panvala_utils } from './index';
import { utils } from 'ethers';
import { BasicToken, Gatekeeper } from '../types';

const { generateCommitHash, randomSalt, generateCommitMessage, ballotDates } = panvala_utils.voting;

export { generateCommitHash, randomSalt, generateCommitMessage, ballotDates };

export async function getMaxVotingRights(
  panBalance: utils.BigNumber,
  votingRights: utils.BigNumber,
  gkAllowance: utils.BigNumber,
  token: BasicToken,
  gatekeeper: Gatekeeper
) {
  let numTokens: utils.BigNumber = utils.bigNumberify('0');
  // NOTE: this userflow might need revision
  // check if user has voteTokenBalance
  if (votingRights.gt('0') && panBalance.eq('0')) {
    console.log('only votingRights');
    // entire balance is being used as votingRights
    // -> vote w/ votingRights
    numTokens = votingRights;
  } else if (votingRights.gt('0') && panBalance.gt('0')) {
    console.log('both votingRights and user balance');
    // balance is split between gate_keeper and user_account
    if (gkAllowance.gt(panBalance)) {
      // allowance > balance
      // -> use all balance + votingRights
      numTokens = panBalance.add(votingRights);
    } else {
      // allowance <= balance
      // -> use allowance + votingRights
      numTokens = gkAllowance.add(votingRights);
    }
  } else if (gkAllowance.eq('0') && panBalance.gt('0')) {
    console.log('no allowance. only user balance');
    // allowance is 0
    // -> approve the gatekeeper contract first, then vote with entire balance
    await token.functions.approve(gatekeeper.address, panBalance);
    numTokens = panBalance;
  } else if (votingRights.eq('0') && panBalance.gt('0')) {
    console.log('no voting rights. only user balance');
    // entire balance is being kept by user
    // -> vote with entire balance
    numTokens = panBalance;
  }

  return numTokens;
}
