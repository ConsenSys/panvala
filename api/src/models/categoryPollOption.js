'use strict';
module.exports = (sequelize, DataTypes) => {
  const CategoryPollOption = sequelize.define(
    'CategoryPollOption',
    {
      pollID: DataTypes.INTEGER,
      categoryID: DataTypes.INTEGER,
    },
    {}
  );
  CategoryPollOption.associate = function(models) {
    // --> pollOption.getPoll()
    CategoryPollOption.belongsTo(models.CategoryPoll, {
      as: 'poll',
      foreignKey: 'pollID',
    });
  };
  return CategoryPollOption;
};
