'use strict';
module.exports = (sequelize, DataTypes) => {
  const Slate = sequelize.define('Slate', {
    slateID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      // unique: 'slate',
    },
    metadataHash: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: 'slate',
      validate: {
        notEmpty: true,
      }
    },
    email: {
      type: DataTypes.STRING,
      // I'd like to use email validation here, but it won't allow empty strings
      // validate: {
      //   isEmail: true,
      //},
    },
    verifiedRecommender: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {});
  Slate.associate = function(models) {
    // associations can be defined here
  };
  return Slate;
};
