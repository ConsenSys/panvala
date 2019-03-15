const { validationResult } = require('express-validator/check');
const { SubmittedBallot, VoteChoice } = require('../models');

module.exports = {
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
        console.log(err);
        res.status(400).send(`Improper ballot format: ${err}`);
      });
  },

  /**
   * Transform into the right format to be saved
   */
  process(req, res, next) {
    // Check that it was properly validated
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = 'Invalid request data';
      // console.log(msg, errors.array());
      return res.status(400).json({
        msg,
        errors: errors.array(),
      });
    }

    // Transform into the structure to be inserted into the database
    const { ballot, signature } = req.body;

    // TODO: check that the signature matches the body
    // console.log(ballot, signature);

    const { epochNumber, salt, voterAddress, choices } = ballot;

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
