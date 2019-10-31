'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CategoryPollResponses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pollID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'CategoryPolls',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
      account: {
        allowNull: false,
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
    return queryInterface.dropTable('CategoryPollResponses');
  },
};
