'use strict';
module.exports = (sequelize, DataTypes) => {
  const FundingCategory = sequelize.define(
    'FundingCategory',
    {
      code: DataTypes.STRING,
      displayName: DataTypes.STRING,
    },
    {}
  );
  FundingCategory.associate = function(models) {
    // associations can be defined here
  };
  return FundingCategory;
};
