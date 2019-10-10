import * as ethers from 'ethers';
import { flatten } from 'lodash';
import { contractABIs } from '../utils';

const { utils } = ethers;
const { Gatekeeper, TokenCapacitor } = contractABIs;

const config = require('./config');
const { rpcEndpoint } = config;
const { gatekeeperAddress, tokenCapacitorAddress } = config.contracts;
const { getEventsFromDatabase } = require('./events');
const { Request } = require('../models');

const notifications = {
  PROPOSAL_INCLUDED_IN_SLATE: {
    type: 'PROPOSAL_INCLUDED_IN_SLATE',
    // proposalID: 1,
    // slateID: 1,
  },
  PROPOSAL_REJECTED: {
    type: 'PROPOSAL_REJECTED',
    // proposalID: 1,
  },
  SLATE_ACCEPTED: {
    type: 'SLATE_ACCEPTED',
    // slateID: 1,
  },
  SLATE_REJECTED: {
    type: 'SLATE_REJECTED',
    // slateID: 1,
  },
  BALLOT_OPEN: {
    type: 'BALLOT_OPEN',
    // epochNumber: 1,
  },
  BALLOT_CLOSED: {
    type: 'BALLOT_CLOSED',
    // epochNumber: 1,
  },
  WITHDRAW_VOTING_RIGHTS: {
    type: 'WITHDRAW_VOTING_RIGHTS',
  },
  WITHDRAW_STAKE: {
    type: 'WITHDRAW_STAKE',
    // slateID: 1,
  },
  WITHDRAW_GRANT: {
    type: 'WITHDRAW_GRANT',
    // proposalID: 1,
  },
};

// The events we care about for notifications
const eventNames = [
  'SlateCreated',
  'ProposalCreated',
  'ContestAutomaticallyFinalized',
  'ContestFinalizedWithoutWinner',
  'VoteFinalized',
  'RunoffFinalized',
];

// Get events related to this address from the database and generate notifications
// TODO: filter query further, only process recent events
export async function getNotificationsByAddress(address) {
  // Don't process events if we're not connected to the contracts
  if (!gatekeeperAddress || !tokenCapacitorAddress) {
    return [];
  }

  const events = await getEventsFromDatabase({ names: eventNames });

  const print = false;
  if (print) {
    events.map(e => {
      // print out event name and block.timestamp
      console.log(e.name, e.timestamp);
      // print out event values for debugging
      Object.keys(e.values).map(arg => {
        console.log(arg, e.values[arg]);
      });
      console.log('');
    });
  }
  console.log('events:', events.length);
  console.log('');

  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, provider);
  const tokenCapacitor = new ethers.Contract(tokenCapacitorAddress, TokenCapacitor.abi, provider);

  const grantResource = tokenCapacitor.address;

  const userAddress = utils.getAddress(address);

  // const slateCreatedEvents = events.filter(event => event.name === 'SlateCreated');

  // callback returns lists of notifications
  const nestedNotifications = events.map(async event => {
    // Finalized -> slate accepted, withdraw grant, withdraw stake, withdraw voting tokens
    // console.log(event.name, event.values);

    if (event.name.includes('Finalized')) {
      const { winningSlate, epochNumber, resource } = event.values;
      if (!winningSlate) {
        return null;
      }

      // Slate Accepted
      const slate = await gatekeeper.slates(winningSlate);
      const { recommender } = slate;

      const slateAcceptedNotifications =
        utils.getAddress(recommender) === userAddress
          ? [
              {
                ...notifications.SLATE_ACCEPTED,
                event,
                slateID: utils.bigNumberify(winningSlate).toString(),
                epochNumber,
                resource,
                recommender,
              },
            ]
          : [];

      // Withdraw Grant
      const slateRequests = await gatekeeper.slateRequests(winningSlate);
      const withdrawGrantNotifications = await Promise.all(
        slateRequests.map(async requestID => {
          // get grant proposal matching this request
          const request = await Request.findOne({
            where: {
              requestID: requestID.toString(),
              resource: grantResource,
            },
          });

          if (request !== null) {
            const proposalID = request.proposalID;
            const proposal = await tokenCapacitor.proposals(proposalID);
            // TODO: do not include if expired

            const { to, withdrawn } = proposal;

            if (!withdrawn && address && to && utils.getAddress(to) === userAddress) {
              return {
                ...notifications.WITHDRAW_GRANT,
                event,
                proposalID,
                requestID,
              };
            }
          }

          return null;
        })
      );

      // Withdraw Stake
      const withdrawStakeNotifications = [];
      if (
        slate.staker &&
        address &&
        slate.stake &&
        utils.getAddress(slate.staker) === userAddress &&
        utils.bigNumberify(slate.stake).gt(utils.bigNumberify('0'))
      ) {
        withdrawStakeNotifications.push({
          ...notifications.WITHDRAW_STAKE,
          event,
          slateID: utils.bigNumberify(winningSlate).toString(),
          stake: utils.bigNumberify(slate.stake).toString(),
        });
      }

      const slateNotifications: any[] = [];
      return slateNotifications
        .concat(slateAcceptedNotifications)
        .concat(withdrawGrantNotifications)
        .concat(withdrawStakeNotifications);
    } // Finalized

    return null;
  });

  const result = flatten(await Promise.all(nestedNotifications)).filter(event => !!event);
  // console.log(result);

  return result;
}
