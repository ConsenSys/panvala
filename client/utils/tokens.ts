import { utils } from 'ethers';
import { IProposal, ISlate } from '../interfaces';
import { Gatekeeper, TokenCapacitor } from '../types';
import { baseToConvertedUnits, convertedToBaseUnits } from './format';

// Estimates the number of tokens that would be available given the current context
export async function projectedAvailableTokens(
  tokenCapacitor: TokenCapacitor,
  gatekeeper: Gatekeeper,
  epochNumber: number,
  winningSlate?: ISlate
) {
  // project the unlocked token balance at the start of the next epoch
  let pUnlockedBalance = utils.bigNumberify('0');
  if (tokenCapacitor.functions.hasOwnProperty('projectedUnlockedBalance')) {
    const nextEpochStart = await gatekeeper.functions.epochStart(epochNumber + 1);
    pUnlockedBalance = await tokenCapacitor.functions.projectedUnlockedBalance(nextEpochStart);
  }
  console.log('projected unlocked balance:', baseToConvertedUnits(pUnlockedBalance));

  let unredeemedTokens = '0';
  if (winningSlate && winningSlate.proposals.length) {
    // filter out all the proposals that have been withdrawn already
    const unredeemedGrantsPromises = winningSlate.proposals.filter(async p => {
      const proposal = await tokenCapacitor.functions.proposals(p.id);
      return !proposal.withdrawn;
    });
    const unredeemedGrants: IProposal[] = await Promise.all(unredeemedGrantsPromises);

    // add up all the unredeemed tokens
    if (unredeemedGrants.length) {
      unredeemedTokens = unredeemedGrants.reduce((acc: string, p: IProposal) => {
        return utils
          .bigNumberify(acc)
          .add(convertedToBaseUnits(p.tokensRequested))
          .toString();
      }, '0');
    }
  }
  console.log('unredeemed tokens:', baseToConvertedUnits(unredeemedTokens));

  // subtract the unredeemed tokens from the projected
  // total unlocked balance at the start of the next epoch
  const projectedAvailableBalance = pUnlockedBalance.sub(unredeemedTokens);
  console.log('projected available balance:', baseToConvertedUnits(projectedAvailableBalance));
  return projectedAvailableBalance;
}
