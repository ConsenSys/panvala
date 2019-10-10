'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return Promise.all([
      queryInterface.addColumn('Proposals', 'website', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Proposals', 'projectPlan', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Proposals', 'projectTimeline', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Proposals', 'teamBackgrounds', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Proposals', 'totalBudget', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'n/a',
      }),
      queryInterface.addColumn('Proposals', 'otherFunding', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'n/a',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return Promise.all([
      queryInterface.removeColumn('Proposals', 'website'),
      queryInterface.removeColumn('Proposals', 'projectPlan'),
      queryInterface.removeColumn('Proposals', 'projectTimeline'),
      queryInterface.removeColumn('Proposals', 'teamBackgrounds'),
      queryInterface.removeColumn('Proposals', 'totalBudget'),
      queryInterface.removeColumn('Proposals', 'otherFunding'),
    ]);
  },
};
