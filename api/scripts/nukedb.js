const readline = require('readline');
const { SubmittedBallot, Slate } = require('../models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Do you want to truncate the Slate table? [y/N]`, async answer => {
  if (answer === 'y') {
    console.log('nuking slate and submittedBallots');
    await Slate.truncate({
      cascade: true,
      restartIdentity: true,
    });
  } else {
    console.log('Skipping truncation of Slate table');
  }

  rl.question(`Do you want to truncate the SubmittedBallot table? [y/N]`, async answer => {
    if (answer === 'y') {
      console.log('nuking slate and submittedBallots');
      await SubmittedBallot.truncate({
        cascade: true,
        restartIdentity: true,
      });
    } else {
      console.log('Skipping truncation of SubmittedBallot table');
    }

    rl.close();
    process.exit(0);
  });
});
