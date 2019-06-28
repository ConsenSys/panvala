import { utils } from 'ethers';
const { solidityKeccak256, randomBytes, bigNumberify } = utils;

interface IChoices {
  firstChoice: utils.BigNumber;
  secondChoice: utils.BigNumber;
}

const SlateCategories = {
  GRANT: '0',
  GOVERNANCE: '1',
};

const ContestStatus = {
  Empty: '0',
  NoContest: '1',
  Active: '2',
  RunoffPending: '3',
  Finalized: '4',
};

/**
 * generateCommitHash
 *
 * Concatenate each (resource, firstChoice, secondChoice), followed
 * by the salt, each element as a full 32-byte word. Hash the result.
 *
 * keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {*} votes { resource: { firstChoice, secondChoice }}
 * @param {ethers.BN} salt Random 256-bit number
 */
function generateCommitHash(votes: any, salt: utils.BigNumber): string {
  const types: string[] = [];
  const values: any[] = [];

  Object.keys(votes).forEach((resource: string) => {
    const { firstChoice, secondChoice }: IChoices = votes[resource];
    types.push('address', 'uint', 'uint');
    values.push(resource, firstChoice, secondChoice);
  });
  types.push('uint');
  values.push(salt);

  // const packed = ethers.utils.solidityPack(types, values);
  // console.log(packed);
  return solidityKeccak256(types, values);
}

/**
 * Calculate a random number w/ 32 bytes of entropy
 * @return {ethers.BN}
 */
function randomSalt(): utils.BigNumber {
  const salt: utils.BigNumber = bigNumberify(randomBytes(32));
  return salt;
}

/**
 * generateCommitMessage
 *
 * @param {string} commitHash keccak256(category + firstChoice + secondChoice ... + salt)
 * @param {*} ballotChoices { firstChoice, secondChoice }
 * @param {string} salt Random 256-bit number
 */
function generateCommitMessage(commitHash: string, ballotChoices: any, salt: string) {
  return `Commit hash: ${commitHash}. First choice: ${ballotChoices.firstChoice}. Second choice: ${
    ballotChoices.secondChoice
  }. Salt: ${salt}`;
}

/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 * @param {*} resources
 * @param {*} firstChoices
 * @param {*} secondChoices
 */
function encodeBallot(resources: string[], firstChoices: string[], secondChoices: string[]) {
  const types = ['address[]', 'uint256[]', 'uint256[]'];
  const values = [resources, firstChoices, secondChoices];

  const encoded = utils.defaultAbiCoder.encode(types, values);
  return encoded;
}

const BN = (small: utils.BigNumberish) => utils.bigNumberify(small);

/**
 * Calculate the next slate submission deadline as halfway between now and the start of the
 * commit period.
 */
function slateSubmissionDeadline(votingOpenDate: number, lastStaked: number) {
  // prettier-ignore
  const extraTime = BN(votingOpenDate).sub(BN(lastStaked)).div('2');
  return BN(lastStaked)
    .add(extraTime)
    .toNumber();
}

interface IBallotDates {
  startDate: number;
  votingOpenDate: number;
  votingCloseDate: number;
  finalityDate: number;
  initialSlateSubmissionDeadline: number;
  slateSubmissionDeadline: {
    [key: string]: number;
  };
  epochNumber: number;
}

function ballotDates(startDate: number = 1549040400): IBallotDates {
  const oneWeekSeconds = 604800;
  const epochStartDate = utils.bigNumberify(startDate).toNumber();
  const week11EndDate: number = epochStartDate + oneWeekSeconds * 11; // 1555689600
  const week12EndDate: number = week11EndDate + oneWeekSeconds;
  const week13EndDate: number = week12EndDate + oneWeekSeconds;
  const initialSlateSubmissionDeadline = slateSubmissionDeadline(week11EndDate, startDate);

  return {
    startDate: epochStartDate,
    votingOpenDate: week11EndDate,
    votingCloseDate: week12EndDate,
    finalityDate: week13EndDate,
    initialSlateSubmissionDeadline,
    // TODO: use the resource (addresses) instead of GRANT/GOVERNANCE
    slateSubmissionDeadline: {
      GRANT: 0,
      GOVERNANCE: 0,
    },
    epochNumber: 0,
  };
}


module.exports = {
  generateCommitHash,
  randomSalt,
  generateCommitMessage,
  encodeBallot,
  SlateCategories,
  ContestStatus,
  slateSubmissionDeadline,
  ballotDates,
};
