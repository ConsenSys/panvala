module.exports = (Sequelize, DataTypes) => {
  return Sequelize.define('ContractEvent', {
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    txHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      length: 66,
    },
    logIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender: {
      type: DataTypes.TEXT,
      allowNull: false,
      length: 42,
    },
    recipient: {
      type: DataTypes.TEXT,
      allowNull: true,
      length: 42,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    values: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });
};
