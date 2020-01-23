'use strict';
module.exports = (sequelize, DataTypes) => {
  const Donation = sequelize.define(
    'Donation',
    {
      // transaction info
      txHash: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
        allowNull: false,
        unique: true,
      },
      metadataHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      donor: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      tokens: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      // IPFS metadata
      metadataVersion: {
        type: DataTypes.STRING,
      },
      memo: {
        type: DataTypes.STRING,
      },
      usdValueCents: {
        type: DataTypes.INTEGER,
        get() {
          // output as string, since we expect input as string
          const value = this.getDataValue('usdValueCents');
          return value != null ? value.toString() : value;
        },
      },
      ethValue: {
        type: DataTypes.STRING,
      },
      pledgeMonthlyUSDCents: {
        type: DataTypes.INTEGER,
      },
      pledgeTerm: {
        type: DataTypes.INTEGER,
      },
      // user info
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      company: {
        type: DataTypes.STRING,
      },
      // extra data
      fundraiser: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.STRING,
      }
    },
    {}
  );
  Donation.associate = function(models) {
    // associations can be defined here
  };
  return Donation;
};
