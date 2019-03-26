import { utils } from 'ethers';
const { solidityKeccak256, randomBytes, bigNumberify } = utils;

interface IChoices {
  firstChoice: utils.BigNumber;
  secondChoice: utils.BigNumber;
}

/**
 * generateCommitHash
 *
 * Concatenate each (category, firstChoice, secondChoice), followed
 * by the salt, each element as a full 32-byte word. Hash the result.
 *
 * keccak256(category + firstChoice + secondChoice ... + salt)
 * @param {*} votes { category: { firstChoice, secondChoice }}
 * @param {ethers.BN} salt Random 256-bit number
 */
function generateCommitHash(votes: any, salt: utils.BigNumber): string {
  const types: string[] = [];
  const values: any[] = [];

  Object.keys(votes).forEach((category: string) => {
    const { firstChoice, secondChoice }: IChoices = votes[category];
    types.push('uint', 'uint', 'uint');
    values.push(category, firstChoice, secondChoice);
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

module.exports = {
  generateCommitHash,
  randomSalt,
  generateCommitMessage,
};
