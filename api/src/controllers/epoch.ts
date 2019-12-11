import { getContracts } from '../utils/eth';
import { bigNumberify, BigNumber } from 'ethers/utils';
import { timing } from 'panvala-utils';

export async function getDates(req, res) {
  let { epochNumber }: { epochNumber: string } = req.params;

  const { gatekeeper, tokenCapacitor } = await getContracts();
  const currentEpoch: BigNumber = await gatekeeper.currentEpochNumber();

  if (epochNumber === 'current') {
    epochNumber = currentEpoch.toString();
  }
  // console.log('epochNumber:', epochNumber);

  try {
    const epochBN = bigNumberify(epochNumber);
    // validate
    if (epochBN.gt(currentEpoch) || epochBN.lt('0')) {
      return res.status(400).json({
        msg: 'Invalid epoch number provided',
        errors: [],
      });
    }

    const epochDates = await timing.getEpochDetails(epochBN, gatekeeper, tokenCapacitor.address);
    const nextEpochDates = await timing.getEpochDetails(
      epochBN.add(1),
      gatekeeper,
      tokenCapacitor.address
    );

    res.json({
      epochDates,
      nextEpochDates,
    });
  } catch (error) {
    return res.status(400).json({
      msg: 'Error',
      errors: [error],
    });
  }
}
