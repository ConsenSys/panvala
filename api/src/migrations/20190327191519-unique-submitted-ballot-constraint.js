'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('SubmittedBallots', ['epochNumber', 'voterAddress'], {
      type: 'unique',
      name: 'singleVotePerEpoch',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('SubmittedBallots', 'singleVotePerEpoch');
  },
};
