module.exports = (Sequelize, DataTypes) => {
  const Proposal = Sequelize.define('Proposal', {
    // proposal info
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
      length: 5000,
    },
    tokensRequested: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // user's personal info
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
      allowNull: false,
    },
    github: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      validate: { isIP: true },
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    projectPlan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectTimeline: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    teamBackgrounds: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalBudget: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otherFunding: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    awardAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Proposal;
};
