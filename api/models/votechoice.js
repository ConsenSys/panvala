'use strict';
module.exports = (sequelize, DataTypes) => {
  const VoteChoice = sequelize.define(
    'VoteChoice',
    {
      firstChoice: DataTypes.STRING,
      secondChoice: DataTypes.STRING,
    },
    {}
  );
  VoteChoice.associate = function(models) {
    // Include a reference to the associated ballot
    // Access via getBallot()
    VoteChoice.belongsTo(models.SubmittedBallot, {
      as: 'ballot',
    });
  };
  return VoteChoice;
};
