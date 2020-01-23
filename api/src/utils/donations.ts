import { ensureChecksumAddress } from './format';

const { Donation } = require('../models');

// Base transaction info -- all required
export interface IDonationTx {
  txHash: string;
  metadataHash: string;
  sender: string;
  donor: string;
  tokens: string;
}

// Donation data that is public
export interface IPublicDonation extends IDonationTx {
  metadataVersion?: string;
  memo?: string;
  usdValueCents?: string;
  ethValue?: string;
  pledgeMonthlyUSDCents?: number;
  pledgeTerm?: number;
}

export interface IDonation extends IPublicDonation {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  // extra fields
  fundraiser?: string;
  message?: string;
}

export function addDonation(donation: IDonation) {
  const { sender, donor } = donation;

  // Normalize donation data before saving for consistent
  // retrieval
  const normalized: IDonation = {
    ...donation,
    sender: ensureChecksumAddress(sender),
    donor: ensureChecksumAddress(donor),
  };

  return Donation.create(normalized);
}

const publicFields = [
  'txHash',
  'metadataHash',
  'sender',
  'donor',
  'tokens',
  'metadataVersion',
  'memo',
  'usdValueCents',
  'ethValue',
  'pledgeMonthlyUSDCents',
  'pledgeTerm',
];

export function getPublicDonations(): Promise<IPublicDonation[]> {
  return Donation.findAll({
    attributes: publicFields,
  });
}

export function getDonationsForFundraiser(fundraiser: string): Promise<IPublicDonation[]> {
  return Donation.findAll({
    attributes: publicFields,
    where: {
      fundraiser,
    },
  });
}

export function calculateStats(donations: any[]) {
  const initialState = { totalUsdCents: 0, donors: {} };
  const stats = donations.reduce((prev, current) => {
    const { usdValueCents, firstName, lastName, createdAt } = current;

    // ignore null cents values
    const centsValue: number = usdValueCents != null ? parseInt(usdValueCents) : 0;

    // if there's a first name or a last name, use that as the key
    // otherwise, add an entry for 'Anonymous'
    const rawKey = firstName != null || lastName != null ? `${firstName} ${lastName || ''}` : 'Anonymous';
    const key = rawKey.trim();

    const totalUsdCents: number = prev.totalUsdCents + centsValue;

    // update existing entry
    if (prev.donors[key] != null) {
      // console.log('updating entry >', key);
      const donors = prev.donors[key];
      donors.push({ usdValueCents: centsValue, timestamp: createdAt });

      return {
        ...prev,
        totalUsdCents,
        donors: {
          ...prev.donors,
          [key]: donors,
        }
      }
    } else {
      // create new entry
      // console.log('creating new entry >', key);
      return {
        ...prev,
        totalUsdCents,
        donors: {
          ...prev.donors,
          [key]: [{ usdValueCents: centsValue, timestamp: createdAt }],
        }
      }
    }

  }, initialState);

  return stats;
}

export async function getQuarterlyDonationStats(fundraiser: string) {
  // TODO: limit to current quarter
  const donations = await Donation.findAll({ where: { fundraiser }});
  return calculateStats(donations);
}
