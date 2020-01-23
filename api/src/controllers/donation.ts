import {
  addDonation,
  getPublicDonations,
  getDonationsForFundraiser,
  getQuarterlyDonationStats,
} from '../utils/donations';
import { validateDonation } from '../utils/validation';

export function create(req, res) {
  // Validate input
  const valid = validateDonation(req.body);
  if (!valid) {
    const msg = 'Invalid donation request data';
    const errors = validateDonation.errors;

    console.error(errors);
    return res.status(400).json({
      msg,
      errors,
    });
  }

  const donation = req.body;
  console.log('Donation:', donation);

  return addDonation(donation)
    .then(result => res.json(result))
    .catch(error => {
      console.error(error);
      return res.status(400).json({
        msg: error.message,
        errors: error.errors,
      });
    });
}

export function list(req, res) {
  return getPublicDonations()
    .then(result => res.json(result))
    .catch(error => {
      console.error(error);
      return res.status(400).json({
        msg: error.message,
        errors: error.errors,
      });
    });
}

const invalidString = (value) => {
  return value == null || typeof value !== 'string' || value.length === 0;
}

export function getByFundraiser(req, res) {
  const { fundraiser } = req.params;

  // fundraiser must be a non-empty string
  if (invalidString(fundraiser)) {
    return res.status(404);
  }

  return getDonationsForFundraiser(fundraiser)
    .then(donations => {
      return res.json(donations);
    })
    .catch(error => {
      const msg = `Error getting donations: ${error}`;
      console.error(msg);
      return res.status(500).send(msg);
    });
}

export function getStatsByFundraiser(req, res) {
  const { fundraiser } = req.params;

  // fundraiser must be a non-empty string
  if (invalidString(fundraiser)) {
    return res.status(404);
  }

  return getQuarterlyDonationStats(fundraiser)
    .then(stats => res.json(stats))
    .catch(error => {
      const msg = `Error getting donation stats: ${error}`;
      console.error(msg);
      return res.status(500).send(msg);
    });
}
