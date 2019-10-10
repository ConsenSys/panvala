'use strict';
module.exports = (sequelize, DataTypes) => {
  const SubmittedBallot = sequelize.define(
    'SubmittedBallot',
    {
      epochNumber: {
        type: DataTypes.STRING,
        validate: {
          // Will be a BN, but grows very slowly
          isInt: true,
        },
      },
      salt: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      voterAddress: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      signature: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
    },
    {}
  );
  SubmittedBallot.associate = function(models) {
    // Include references to vote choices
    // SubmittedBallot has many VoteChoices

    // Gather up VoteChoices by ballotId
    SubmittedBallot.hasMany(models.VoteChoice, {
      foreignKey: 'ballotId',
    });
  };
  return SubmittedBallot;
};
