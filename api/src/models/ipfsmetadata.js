'use strict';

module.exports = (sequelize, DataTypes) => {
  const IpfsMetadata = sequelize.define(
    'IpfsMetadata',
    {
      multihash: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      tableName: 'IpfsMetadatas',
    }
  );

  IpfsMetadata.associate = function(models) {
    // associations can be defined here
  };

  return IpfsMetadata;
};
