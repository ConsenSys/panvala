'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const ethers_1 = require('ethers');
const { solidityKeccak256, randomBytes, bigNumberify } = ethers_1.utils;
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
function sortedResources(choices) {
  return Object.keys(choices).sort();
}
/**
 * generateCommitHash
 *
 * Concatenate each (resource, firstChoice, secondChoice), followed
 * by the salt, each element as a full 32-byte word. Hash the result.
 *
 * keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {IChoices} votes { resource: { firstChoice, secondChoice }}
 * @param {ethers.BN} salt Random 256-bit number
 */
function generateCommitHash(votes, salt) {
  const types = [];
  const values = [];
  sortedResources(votes).forEach(resource => {
    const { firstChoice, secondChoice } = votes[resource];
    types.push('address', 'uint', 'uint');
    values.push(resource, firstChoice, secondChoice);
  });
  types.push('uint');
  values.push(salt);
  // const packed = ethers.utils.solidityPack(types, values);
  // console.log(packed);
  return solidityKeccak256(types, values);
}
exports.generateCommitHash = generateCommitHash;
/**
 * Calculate a random number w/ 32 bytes of entropy
 * @return {ethers.BN}
 */
function randomSalt() {
  const salt = bigNumberify(randomBytes(32));
  return salt;
}
exports.randomSalt = randomSalt;
/**
 * generateCommitMessage
 *
 * @param {string} commitHash keccak256(resource + firstChoice + secondChoice ... + salt)
 * @param {IChoices} ballotChoices { resource: { firstChoice, secondChoice } }
 * @param {string} salt Random 256-bit number
 */
function generateCommitMessage(commitHash, ballotChoices, salt) {
  const choiceStrings = sortedResources(ballotChoices).map(resource => {
    const { firstChoice, secondChoice } = ballotChoices[resource];
    return `    Resource: ${resource}. First choice: ${firstChoice}. Second choice: ${secondChoice}`;
  });
  const choices = choiceStrings.join('\n');
  const msg = [`Commit hash: ${commitHash}`, `Choices:\n${choices}`, `Salt: ${salt}`].join('\n');
  return msg;
}
exports.generateCommitMessage = generateCommitMessage;
/**
 * Encode a ballot to be submitted to Gatekeeper.revealManyBallots()
 * @param {*} resources
 * @param {*} firstChoices
 * @param {*} secondChoices
 */
function encodeBallot(resources, firstChoices, secondChoices) {
  const types = ['address[]', 'uint256[]', 'uint256[]'];
  const values = [resources, firstChoices, secondChoices];
  const encoded = ethers_1.utils.defaultAbiCoder.encode(types, values);
  return encoded;
}
exports.encodeBallot = encodeBallot;
const BN = small => ethers_1.utils.bigNumberify(small);
/**
 * Calculate the next slate submission deadline as halfway between now and the start of the
 * commit period.
 */
function slateSubmissionDeadline(votingOpenDate, lastStaked) {
  // prettier-ignore
  const extraTime = BN(votingOpenDate).sub(BN(lastStaked)).div('2');
  return BN(lastStaked)
    .add(extraTime)
    .toNumber();
}
exports.slateSubmissionDeadline = slateSubmissionDeadline;
function ballotDates(startDate = 1549040400) {
  const oneWeekSeconds = 604800;
  const epochStartDate = ethers_1.utils.bigNumberify(startDate).toNumber();
  const week11EndDate = epochStartDate + oneWeekSeconds * 11; // 1555689600
  const week12EndDate = week11EndDate + oneWeekSeconds;
  const week13EndDate = week12EndDate + oneWeekSeconds;
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
exports.ballotDates = ballotDates;
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
//# sourceMappingURL=index.js.map
