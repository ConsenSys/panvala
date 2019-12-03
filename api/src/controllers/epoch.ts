import { getContracts } from '../utils/eth';
import { bigNumberify, BigNumber } from 'ethers/utils';
import { timing } from 'panvala-utils';

interface EpochDates {
  epochNumber: number;
  epochStart: number;
  proposalSubmissionOpens: number;
  proposalSubmissionCloses: number;
  slateCreationOpens: number;
  slateCreationCloses: number;
  votingOpens: number;
  votingCloses: number;
  votingConcludes: number;
}

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

    const epochStart: BigNumber = await gatekeeper.epochStart(epochBN);
    const timings: any = timing.getTimingsForEpoch(epochStart);
    // console.log('timings:', timings);

    // prettier-ignore
    const proposalSubmissionCloses = epochStart.add(timing.durations.ONE_WEEK * 3).toNumber()
    const slateCreationCloses = await gatekeeper.slateSubmissionDeadline(
      epochBN,
      tokenCapacitor.address
    );

    const epochDates: EpochDates = {
      epochNumber: bigNumberify(epochNumber).toNumber(),
      epochStart: timings.epochStart,
      proposalSubmissionOpens: timings.slateSubmissionStart,
      proposalSubmissionCloses,
      slateCreationOpens: timings.slateSubmissionStart,
      slateCreationCloses: slateCreationCloses.toNumber(),
      votingOpens: timings.votingStart,
      votingCloses: timings.votingEnd,
      votingConcludes: timings.epochEnd,
    };

    res.json(epochDates);
  } catch (error) {
    return res.status(400).json({
      msg: 'Error',
      errors: [error],
    });
  }
}
