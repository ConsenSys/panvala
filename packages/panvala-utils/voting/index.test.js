const { utils } = require('ethers');
const { voting } = require('..');

const resource1 = '0xcccccccccccccccccccccccccccccccccccccccc';
const resource2 = '0xdddddddddddddddddddddddddddddddddddddddd';
const resource3 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

test('create a commit hash', () => {
  const votes = {
    [resource1]: {
      firstChoice: '0',
      secondChoice: '1',
    },
    [resource2]: {
      firstChoice: '1',
      secondChoice: '2',
    },
  };

  const salt = utils.bigNumberify('2000');

  const commitHash = voting.generateCommitHash(votes, salt);
  const expectedHash = '0xf3958a46df180640b3066524c17ceeab00d3996eacbe1f35d9284ecd8861c147';

  expect(commitHash).toEqual(expectedHash);
});

test('create a random salt', () => {
  voting.randomSalt();
});

test('should get the same commit hash for different orderings', () => {
  const votes = {
    [resource2]: {
      firstChoice: '0',
      secondChoice: '1',
    },
    [resource1]: {
      firstChoice: '1',
      secondChoice: '2',
    },
    [resource3]: {
      firstChoice: '4',
      secondChoice: '5',
    },
  };

  const votes2 = {
    [resource3]: {
      firstChoice: '4',
      secondChoice: '5',
    },
    [resource2]: {
      firstChoice: '0',
      secondChoice: '1',
    },
    [resource1]: {
      firstChoice: '1',
      secondChoice: '2',
    },
  };

  const salt = utils.bigNumberify('2000');
  const commitHash = voting.generateCommitHash(votes, salt);
  const commitHash2 = voting.generateCommitHash(votes2, salt);
  console.log(commitHash, commitHash2);

  expect(commitHash).toEqual(commitHash2);
});

test('should create a commit message', () => {
  const votes = {
    [resource2]: {
      firstChoice: '0',
      secondChoice: '1',
    },
    [resource1]: {
      firstChoice: '1',
      secondChoice: '2',
    },
    [resource3]: {
      firstChoice: '4',
      secondChoice: '5',
    },
  };
  const salt = utils.bigNumberify('2000');
  const commitHash = voting.generateCommitHash(votes, salt);
  const message = voting.generateCommitMessage(commitHash, votes, salt.toString());

  const expected = `Commit hash: 0xb4122ac518f8b401aa849f5340430396b4f45f4a725ae65421ffe54fc97c130f
Choices:
    Resource: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa. First choice: 4. Second choice: 5
    Resource: 0xcccccccccccccccccccccccccccccccccccccccc. First choice: 1. Second choice: 2
    Resource: 0xdddddddddddddddddddddddddddddddddddddddd. First choice: 0. Second choice: 1
Salt: 2000`;

  expect(message).toEqual(expected);
});
