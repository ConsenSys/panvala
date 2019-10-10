'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('VoteChoices', 'resource', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '0x0000000000000000000000000000000000000000',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('VoteChoices', 'resource');
  },
};
