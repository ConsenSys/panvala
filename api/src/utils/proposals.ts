import { utils } from 'ethers';
import { Schema } from 'express-validator';
import { nonEmptyString } from './validation';
const { Request } = require('../models');

export async function mapProposalsToRequests(proposals: any[], proposalMultihashes: string[]) {
  return Promise.all(
    proposals.map(async (proposal, i) => {
      const multihash = Buffer.from(proposalMultihashes[i]).toString('hex');
      const request = await Request.findOne(
        {
          where: {
            metadataHash: `0x${multihash}`,
          },
        },
        { raw: true }
      );
      if (request == null) {
        return proposal;
      }
      return {
        ...proposal,
        proposalID: request.proposalID,
        requestID: request.requestID,
      };
    })
  );
}

export const proposalSchema: Schema = {
  title: {
    in: ['body'],
    ...nonEmptyString,
    isLength: {
      options: {
        min: 1,
        max: 80,
      },
    },
  },
  summary: {
    in: ['body'],
    ...nonEmptyString,
    isLength: {
      options: {
        min: 1,
        max: 5000,
      },
    },
  },
  tokensRequested: {
    in: ['body'],
    ...nonEmptyString,
    // isNull: false,
    custom: {
      options: value => {
        // validate type: string
        if (typeof value !== 'string') {
          throw new Error('value should be a string');
        }

        // minimum: 1,000,000,000,000,000,000 (1 token)
        const minBase = utils.parseUnits('1', 18);
        // convert into BigNumber to compare, throws if conversion fails
        const bnBase = utils.bigNumberify(value);
        if (bnBase.lt(minBase)) {
          throw new Error('value should be minimum 1 token');
        }

        return value;
      },
    },
  },
  firstName: {
    in: ['body'],
    ...nonEmptyString,
    isLength: {
      options: {
        min: 1,
      },
    },
  },
  lastName: {
    in: ['body'],
    optional: true,
    trim: true,
  },
  email: {
    in: ['body'],
    ...nonEmptyString,
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
    optional: true,
    trim: true,
  },
  otherFunding: {
    in: ['body'],
    optional: true,
    trim: true,
  },
  awardAddress: {
    in: ['body'],
    ...nonEmptyString,
  },
};
