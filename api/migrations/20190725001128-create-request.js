'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      metadataHash: {
        type: Sequelize.STRING,
      },
      resource: {
        type: Sequelize.STRING,
      },
      approved: {
        type: Sequelize.BOOLEAN,
      },
      expirationTime: {
        type: Sequelize.INTEGER,
      },
      proposalID: {
        type: Sequelize.STRING,
      },
      proposer: {
        type: Sequelize.STRING,
      },
      requestID: {
        type: Sequelize.STRING,
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
    return queryInterface.dropTable('Requests');
  },
};
