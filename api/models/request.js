'use strict';
module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define(
    'Request',
    {
      metadataHash: DataTypes.STRING,
      resource: DataTypes.STRING,
      approved: DataTypes.BOOLEAN,
      expirationTime: DataTypes.INTEGER,
      proposalID: DataTypes.STRING,
      proposer: DataTypes.STRING,
      requestID: DataTypes.STRING,
    },
    {}
  );
  Request.associate = function(models) {
    // associations can be defined here
  };
  return Request;
};
