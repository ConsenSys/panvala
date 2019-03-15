import { randomBytes } from 'crypto';
import { utils } from 'ethers';
import { ISubmitBallot } from '../interfaces';

/**
 * Calculate a random string w/ 32 bytes of entropy
 */
export function randomSalt(): string {
  const random32BytesBuffer: Buffer = randomBytes(32);
  const salt: utils.BigNumber = utils.bigNumberify(`0x${random32BytesBuffer.toString('hex')}`);
  return salt.toString();
}

/**
 * Calculate commit_hash(es), given a ballot
 * @returns [keccak256(category, firstChoice, secondChoice, salt)]
 * @param ballot calculated ballot with choices, salt, and voterAddress
 * @param ballotChoicesKeys string keys of ballot choices object (e.g. grant, governance)
 */
export function getCommitHashes(ballot: ISubmitBallot, ballotChoicesKeys: string[]): string[] {
  return ballotChoicesKeys.map((key: string, index: number) => {
    return utils.solidityKeccak256(
      ['uint', 'string', 'string', 'string'],
      [index, ballot.choices[key].firstChoice, ballot.choices[key].secondChoice, ballot.salt]
    );
  });
}
