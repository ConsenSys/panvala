module.exports = {
  proposalSchema: {
    title: {
      in: ['body'],
      exists: true,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
          max: 80,
        },
      },
    },
    summary: {
      in: ['body'],
      exists: true,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
          max: 5000,
        },
      },
    },
    tokensRequested: {
      in: ['body'],
      exists: true,
      isDecimal: {
        options: {
          decimal_digits: '0,18',
        },
      },
    },
    firstName: {
      in: ['body'],
      exists: true,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
        },
      },
      isNull: false,
    },
    lastName: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    email: {
      in: ['body'],
      exists: true,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
        },
      },
      isEmail: true,
    },
    github: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    website: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    projectPlan: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    projectTimeline: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    teamBackgrounds: {
      in: ['body'],
      optional: true,
      trim: true,
    },
    totalBudget: {
      in: ['body'],
      optional: false,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
        },
      },
    },
    otherFunding: {
      in: ['body'],
      optional: false,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
        },
      },
    },
    awardAddress: {
      in: ['body'],
      optional: false,
      trim: true,
      isEmpty: false,
      isLength: {
        options: {
          min: 1,
        },
      },
    },
  },
};
