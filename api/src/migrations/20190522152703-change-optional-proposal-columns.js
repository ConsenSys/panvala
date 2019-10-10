'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .changeColumn('Proposals', 'totalBudget', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'otherFunding', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .changeColumn('Proposals', 'totalBudget', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'n/a',
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'otherFunding', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'n/a',
        });
      });
  },
};
