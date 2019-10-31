'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CategoryPollAllocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pollResponseID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'CategoryPollResponses',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
      categoryID: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'FundingCategories',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
      points: {
        allowNull: false,
        type: Sequelize.INTEGER,
        validate: {
          min: 0,
          max: 100,
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
    return queryInterface.dropTable('CategoryPollAllocations');
  },
};
