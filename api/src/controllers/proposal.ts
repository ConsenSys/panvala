import { validationResult } from 'express-validator';
import * as models from '../models';

const { Proposal } = models;

/**
 * Get the list of proposals
 */
export function getAll(req, res) {
  Proposal.findAll({
    attributes: [
      'id',
      'title',
      'summary',
      'tokensRequested',
      'firstName',
      'lastName',
      'github',
      'website',
      'projectPlan',
      'projectTimeline',
      'teamBackgrounds',
      'totalBudget',
      'otherFunding',
      'awardAddress',
    ],
  }).then(proposals => {
    res.send(proposals);
  });
}

/**
 * Create a new proposal
 */
export function create(req, res) {
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
}
