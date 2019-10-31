'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CategoryPollOptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pollID: {
        type: Sequelize.INTEGER,
        references: {
          model: 'CategoryPolls',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
      categoryID: {
        type: Sequelize.INTEGER,
        references: {
          model: 'FundingCategories',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
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
    return queryInterface.dropTable('CategoryPollOptions');
  },
};
