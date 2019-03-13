'use strict';
module.exports = (sequelize, DataTypes) => {
  const SubmittedBallot = sequelize.define(
    'SubmittedBallot',
    {
      epochNumber: DataTypes.STRING,
      salt: DataTypes.STRING,
      voterAddress: DataTypes.STRING,
      signature: DataTypes.STRING,
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
