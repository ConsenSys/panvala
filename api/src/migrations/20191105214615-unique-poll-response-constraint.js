'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('CategoryPollResponses', ['pollID', 'account'], {
      type: 'unique',
      name: 'singlePollResponsePerAccount',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('CategoryPollResponses', 'singlePollResponsePerAccount');
  },
};
