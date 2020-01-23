import { Wallet } from 'ethers';

import * as models from '../models';
import { parseUnits, hashMessage } from 'ethers/utils';
import { IDonation } from '../utils/donations';

const { Proposal } = models;

export function initProposals() {
  const proposals = [
    {
      title: 'An amazing proposal',
      summary: 'All sorts of amazing things',
      tokensRequested: '200000000000000000000000',
      firstName: 'John',
      lastName: 'Crypto',
      email: 'jc@eth.io',
      github: 'jcrypto',
      website: 'jc.io',
      projectPlan: '2019 is gonna launch',
      projectTimeline: '2020 is gonna moon',
      teamBackgrounds: 'I do this. She does that.',
      totalBudget: '$1,000,000 for this. $500,000 for that.',
      otherFunding: 'none',
      awardAddress: '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7',
    },
    {
      title: 'Another amazing proposal',
      summary: "You won't even believe it",
      tokensRequested: '300000000000000000000000',
      firstName: 'Sarah',
      lastName: 'Ethers',
      email: 'sarah@eth.io',
      github: 'sethers',
      website: 'se.io',
      projectPlan: '2019 is gonna be good',
      projectTimeline: '2020 is gonna be great',
      teamBackgrounds: 'I do this. He does that.',
      totalBudget: '$2,000,000 for this. $100,000 for that.',
      otherFunding: 'n/a',
      awardAddress: '0xD09cc3Bc67E4294c4A446d8e4a2934a921410eD7',
    },
  ];

  // Automatically added fields
  const ipAddress = '1.2.3.4';

  return Promise.all(
    proposals.map(data => {
      const proposal = {
        ipAddress,
        ...data,
      };
      return Proposal.create(proposal).catch(error => {
        console.log(error);
      });
    })
  );
}

export const someAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export const addressB = someAddress.replace('a', 'b');
export const someTxHash = `0x${'b'.repeat(64)}`;
export const someCID = 'Qmbvjad1niHUjhWUrqkYUgXxgyvGbg3rFDGfZBUVx4gyJX';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
export function getWallet() {
  return Wallet.fromMnemonic(mnemonic);
}

// Does case-insensitive comparison for strings, but regular strict
// equality for other types
function lenientValueCheck(actual: any, expected: any) {
  const isString = typeof actual === 'string';
  if (isString) {
    expect(actual.toLowerCase()).toBe(expected.toLowerCase());
  } else {
    expect(actual).toBe(expected);
  }
}

// Check that all expected fields are there
export function expectFields(actual: object, expected: object) {
  Object.keys(expected).forEach(key => {
    lenientValueCheck(actual[key], expected[key]);
  });
}

export function expectFieldsWithTypes(actual: object, expected: object) {
  Object.keys(expected).forEach(key => {
    lenientValueCheck(actual[key], expected[key]);
    expect(typeof actual[key]).toBe(typeof expected[key]);
  });
}

export function toBaseTokens(amount: number, decimals: number = 18): string {
  return parseUnits(amount.toString(), decimals).toString();
}

const fundraiser = 'fundraiser-1';
const metadataHash = someCID;
export const testFundraiserDonations: IDonation[] = [
  {
    txHash: hashMessage('Mary'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    firstName: 'Mary',
    lastName: 'Eckert',
    tokens: '200',
    usdValueCents: '2000',
    fundraiser,
  },
  {
    txHash: hashMessage('Nicky'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    firstName: 'Nicky',
    lastName: 'Stevens',
    tokens: '100',
    usdValueCents: '1000',
    fundraiser,
  },
  {
    txHash: hashMessage('David'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    firstName: 'David',
    lastName: 'West',
    tokens: '25',
    usdValueCents: '2500',
    fundraiser,
  },
  {
    txHash: hashMessage('nobody'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    tokens: '25',
    usdValueCents: '2500',
    fundraiser,
  },
  {
    txHash: hashMessage('anonymous'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    tokens: '50',
    usdValueCents: '5000',
    fundraiser,
  },
  {
    txHash: hashMessage('first'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    tokens: '25',
    usdValueCents: '2500',
    firstName: 'John',
    fundraiser,
  },
  {
    txHash: hashMessage('David 2'),
    metadataHash,
    sender: someAddress,
    donor: someAddress,
    firstName: 'David',
    lastName: 'West',
    tokens: '25',
    usdValueCents: '2500',
    fundraiser,
  },
];
