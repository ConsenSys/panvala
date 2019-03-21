const voting = require('.');

test('create a commit hash', () => {
  const votes = {
    0: {
      firstChoice: 0,
      secondChoice: 1,
    },
    1: {
      firstChoice: 1,
      secondChoice: 2,
    },
  };

  const salt = '2000';

  const commitHash = voting.generateCommitHash(votes, salt);
  const expectedHash = '0x7ec056187058ffd862ec47ec6ed02344961f1035adfc9db83e0823f9b022174f';

  expect(commitHash).toEqual(expectedHash);
});

test('create a random salt', () => {
  voting.randomSalt();
});
