'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .changeColumn('Proposals', 'projectPlan', {
        type: Sequelize.TEXT,
        allowNull: true,
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'projectTimeline', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'teamBackgrounds', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .changeColumn('Proposals', 'projectPlan', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'projectTimeline', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      })
      .then(() => {
        return queryInterface.changeColumn('Proposals', 'teamBackgrounds', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      });
  },
};
