const { validationResult } = require('express-validator/check');
const { utils } = require('ethers');
const { voting } = require('../../packages/panvala-utils');
const { SubmittedBallot, VoteChoice } = require('../models');
const { validateBallot } = require('../utils/validation');


module.exports = {
  getAll(req, res) {
    SubmittedBallot.findAll().then(ballots => {
      res.send(ballots);
    });
  },
  /**
   * Create a new ballot
   */
  create(req, res) {
    // Check result of validating transformed data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = 'Invalid creation data';
      // console.log(msg, errors.array());
      return res.status(400).json({
        msg,
        errors: errors.array(),
      });
    }

    // console.log('Transformed', req.body);

    // Create a ballot and its associated vote choices
    return SubmittedBallot.create(req.body, {
      include: [
        {
          model: VoteChoice,
        },
      ],
    })
      .then(result => {
        let ballot = result.get({
          plain: true,
        });

        // Rename 'VoteChoices' -> 'voteChoices'
        // TODO: find a better way to do this
        ballot.choices = ballot.VoteChoices;
        delete ballot.VoteChoices;

        res.send(ballot);
      })
      .catch(err => {
        console.error(err);
        res.status(400).send(`Improper ballot format: ${err}`);
      });
  },

  /**
   * Transform into the right format to be saved
   */
  process(req, res, next) {
    // Validate input
    const valid = validateBallot(req.body);
    if (!valid) {
      const msg = 'Invalid request data';
      const errors = validateBallot.errors;

      // console.error(errors);
      return res.status(400).json({
        msg,
        errors,
      });
    }

    // Transform into the structure to be inserted into the database
    const { ballot, signature, commitHash } = req.body;

    const { epochNumber, salt, voterAddress, choices } = ballot;

    // Regenerate commit message
    const message = voting.generateCommitMessage(commitHash, choices['0'], salt);
    // Recover address from signed message
    const recoveredAddress = utils.verifyMessage(message, signature);
    // Validate the signature
    if (recoveredAddress !== voterAddress) {
      return res.status(400).json({
        msg: 'Invalid signature. Recovered signature did not match signer of the commit message.',
        errors: errors.array(),
      });
    }

    const contests = Object.keys(choices);
    // Need to use capital `VoteChoices` for creation
    const VoteChoices = contests.map(contest => choices[contest]);

    // Pass along the transformed data
    req.body = {
      epochNumber,
      voterAddress,
      salt,
      signature,
      VoteChoices,
    };
    // console.log('Processed', req.body);

    next();
  },
};
