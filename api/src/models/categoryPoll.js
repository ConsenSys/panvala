'use strict';
module.exports = (sequelize, DataTypes) => {
  const CategoryPoll = sequelize.define(
    'CategoryPoll',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );
  CategoryPoll.associate = function(models) {
    // --> poll.getOptions()
    CategoryPoll.hasMany(models.CategoryPollOption, {
      as: 'options',
      foreignKey: 'pollID',
    });

    // --> poll.getResponses()
    CategoryPoll.hasMany(models.CategoryPollResponse, {
      as: 'responses',
      foreignKey: 'pollID',
    });
  };
  return CategoryPoll;
};
