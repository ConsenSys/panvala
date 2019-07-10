const { SubmittedBallot, Slate } = require('../models');

function nuke() {
  Slate.truncate({
    cascade: true,
    restartIdentity: true,
  });
  SubmittedBallot.truncate({
    cascade: true,
    restartIdentity: true,
  });
}

nuke();
