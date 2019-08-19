const readline = require('readline');
const { SubmittedBallot, Slate, IpfsMetadata } = require('../models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Do you want to truncate the Slates table? [y/N]`, async answer => {
  if (answer === 'y') {
    console.log('nuking slates');
    await Slate.truncate({
      cascade: true,
      restartIdentity: true,
    });
  } else {
    console.log('Skipping truncation of Slates table');
  }

  rl.question(`Do you want to truncate the SubmittedBallots table? [y/N]`, async answer => {
    if (answer === 'y') {
      console.log('nuking submittedBallots');
      await SubmittedBallot.truncate({
        cascade: true,
        restartIdentity: true,
      });
    } else {
      console.log('Skipping truncation of SubmittedBallots table');
    }

    rl.question(`Do you want to truncate the IpfsMetadata table? [y/N]`, async answer => {
      if (answer === 'y') {
        console.log('nuking ipfsMetadatas');
        await IpfsMetadata.truncate({
          cascade: true,
          restartIdentity: true,
        });
      } else {
        console.log('Skipping truncation of IpfsMetadatas table');
      }

      rl.close();
      process.exit(0);
    });
  });
});
