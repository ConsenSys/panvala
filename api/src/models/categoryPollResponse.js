'use strict';

const _ = require('lodash');

module.exports = (sequelize, DataTypes) => {
  const CategoryPollResponse = sequelize.define(
    'CategoryPollResponse',
    {
      pollID: {
        type: DataTypes.INTEGER,
        unique: 'singlePollResponsePerAccount',
      },
      account: {
        type: DataTypes.STRING,
        unique: 'singlePollResponsePerAccount',
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      validate: {
        async validCategories() {
          const pollOptions = await this.getPoll().then(poll => poll.getOptions());

          if (this.allocations.length !== pollOptions.length) {
            throw new Error('Response must match number of poll options');
          }
          // check categories
          const categories = pollOptions.map(option => option.categoryID);
          const categoriesToSave = this.allocations.map(allocation => allocation.categoryID);

          if (!_.isEqual(categories.sort(), categoriesToSave.sort())) {
            throw new Error('Response categories must match poll options');
          }
        },
        pointsAddUp() {
          const total = this.allocations.reduce((acc, current) => {
            return acc + current.points;
          }, 0);

          if (total !== 100) {
            throw new Error('Points must add up to 100');
          }
        },
      },
    }
  );

  CategoryPollResponse.associate = function(models) {
    // --> response.getAllocations()
    CategoryPollResponse.hasMany(models.CategoryPollAllocation, {
      as: 'allocations',
      foreignKey: 'pollResponseID',
    });

    // --> response.getPoll()
    CategoryPollResponse.belongsTo(models.CategoryPoll, {
      as: 'poll',
      foreignKey: 'pollID',
    });
  };
  return CategoryPollResponse;
};
