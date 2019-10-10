'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ContractEvents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      blockNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      txHash: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      logIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sender: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // 'to' field is null for contract creation transactions
      recipient: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ContractEvents');
  },
};
