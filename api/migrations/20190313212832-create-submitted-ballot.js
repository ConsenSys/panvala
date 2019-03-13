'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('SubmittedBallots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      epochNumber: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      salt: {
        allowNull: false,
        type: Sequelize.STRING
      },
      voterAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      signature: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('SubmittedBallots');
  }
};
