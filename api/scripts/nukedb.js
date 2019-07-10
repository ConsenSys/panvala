const { SubmittedBallot, Slate } = require('../models');

function nuke() {
  Slate.truncate({
    cascade: true,
    restartIdentity: true,
  }).then(() => {
    SubmittedBallot.truncate({
      cascade: true,
      restartIdentity: true,
    }).then(() => {
      console.log('NUKED!');
      process.exit(0);
    });
  });
}

nuke();
