'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('VoteChoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstChoice: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      secondChoice: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ballotId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'SubmittedBallots',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('VoteChoices');
  },
};
