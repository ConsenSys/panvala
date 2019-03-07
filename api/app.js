const express = require('express');
const cors = require('cors');
const { Proposal } = require('./models');
const { checkSchema, validationResult } = require('express-validator/check');
const { getAllSlates } = require('./utils/slates');

const app = express();

// enable ALL CORS requests
app.use(cors());
// see: https://github.com/expressjs/cors#simple-usage-enable-all-cors-requests

// Configuration and middleware

// enable parsing of JSON in POST request bodies
app.use(express.json());

const proposalSchema = {
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
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
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
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
  },
  website: {
    in: ['body'],
    optional: true,
    trim: true,
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
  },
  projectPlan: {
    in: ['body'],
    optional: true,
    trim: true,
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
  },
  projectTimeline: {
    in: ['body'],
    optional: true,
    trim: true,
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
  },
  teamBackgrounds: {
    in: ['body'],
    optional: true,
    trim: true,
    isEmpty: false,
    isLength: {
      options: {
        min: 1,
      },
    },
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
};

// Routes
app.get('/', (req, res) => {
  res.send('This is the Panvala API');
});

/**
 * Get the list of proposals
 */
app.get('/api/proposals', (req, res) => {
  Proposal.findAll().then(proposals => {
    res.send(proposals);
  });
});

/**
 * Create a new proposal
 */
app.post('/api/proposals', checkSchema(proposalSchema), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  // console.log(req.body);
  const {
    title,
    summary,
    tokensRequested,
    firstName,
    lastName,
    email,
    github,
    website,
    projectPlan,
    projectTimeline,
    teamBackgrounds,
    totalBudget,
    otherFunding,
    awardAddress,
  } = req.body;

  const data = {
    title,
    summary,
    tokensRequested,
    firstName,
    lastName,
    email,
    github,
    ipAddress: req.ip,
    website,
    projectPlan,
    projectTimeline,
    teamBackgrounds,
    totalBudget,
    otherFunding,
    awardAddress,
  };

  // Create a proposal, failing if any of the database constraints are not met
  Proposal.create(data)
    .then(p => {
      res.send(p);
    })
    .catch(err => {
      res.status(400).send(`Improper proposal format: ${err}`);
    });
});

app.get('/api/slates', async (req, res) => {
  getAllSlates()
    .then(slates => {
      // console.log('DATA', slates);
      res.send(slates);
    })
    .catch(err => {
      console.log('ERROR', err);
      res.status(500).json({
        err: err.message,
      });
    });
});

module.exports = app;
