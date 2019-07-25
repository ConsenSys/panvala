'use strict';
module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define(
    'Request',
    {
      metadataHash: DataTypes.STRING,
      resource: DataTypes.STRING,
      proposalID: DataTypes.STRING,
      requestID: DataTypes.STRING,
    },
    {}
  );
  Request.associate = function(models) {
    // associations can be defined here
  };
  return Request;
};
