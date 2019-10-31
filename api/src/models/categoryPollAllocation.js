'use strict';
module.exports = (sequelize, DataTypes) => {
  const CategoryPollAllocation = sequelize.define(
    'CategoryPollAllocation',
    {
      pollResponseID: DataTypes.INTEGER,
      categoryID: DataTypes.INTEGER,
      points: DataTypes.INTEGER,
    },
    {}
  );
  CategoryPollAllocation.associate = function(models) {
    // --> pollAllocation.getPollResponse()
    CategoryPollAllocation.belongsTo(models.CategoryPollResponse, {
      as: 'pollResponse',
      foreignKey: 'pollResponseID',
      // TODO: unique pollResponse, category
    });
  };
  return CategoryPollAllocation;
};
