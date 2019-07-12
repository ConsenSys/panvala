const ethers = require('ethers');
const flatten = require('lodash/flatten');
const ipfs = require('./ipfs');
const { utils } = ethers;

const {
  contractABIs: { Gatekeeper, TokenCapacitor },
} = require('../../packages/panvala-utils');

const config = require('./config');
const { rpcEndpoint } = config;
const { gatekeeperAddress, tokenCapacitorAddress } = config.contracts;

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

// NOTE: this function makes a lot of queries and will likely be changed
// the next time the contracts are updated (w/ more event emission args)
// & when we implement an events db
async function getNormalizedNotificationsByEvents(events, address) {
  // this would be useful for saving in the db
  // const eventsByName = groupBy(events, 'name');

  const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
  const gatekeeper = new ethers.Contract(gatekeeperAddress, Gatekeeper.abi, provider);
  const tokenCapacitor = new ethers.Contract(tokenCapacitorAddress, TokenCapacitor.abi, provider);

  // get all events for 'Slate Accepted'
  const slateAcceptedEvents = events.filter(e => e.name.includes('Finalized'));
  const slateAcceptedNotifications = flatten(
    await Promise.all(
      slateAcceptedEvents.map(async event => {
        const { winningSlate, ballotID, categoryID } = event.values;
        const slateRequests = await gatekeeper.slateRequests(winningSlate);
        const withdrawGrantNotifications = flatten(
          await Promise.all(
            slateRequests.map(async requestID => {
              const proposal = await tokenCapacitor.proposals(requestID);
              if (
                utils.getAddress(proposal.to) === utils.getAddress(address) &&
                !proposal.withdrawn
              ) {
                return [
                  {
                    ...notifications.WITHDRAW_GRANT,
                    event,
                    proposalID: utils.bigNumberify(requestID).toString(),
                  },
                ];
              }
              return [];
            })
          )
        );

        let withdrawStakeNotification = [];
        const slate = await gatekeeper.slates(winningSlate);
        if (
          utils.getAddress(slate.staker) === utils.getAddress(address) &&
          utils.bigNumberify(slate.stake).gt(utils.bigNumberify('0'))
        ) {
          withdrawStakeNotification = [
            {
              ...notifications.WITHDRAW_STAKE,
              event,
              slateID: utils.bigNumberify(winningSlate).toString(),
            },
          ];
        }

        // TODO: filter against withdrawn stakes
        return withdrawGrantNotifications.concat(withdrawStakeNotification).concat([
          {
            ...notifications.SLATE_ACCEPTED,
            event,
            slateID: utils.bigNumberify(winningSlate).toString(),
            ballotID,
            categoryID,
            // recommender,
          },
        ]);
      })
    )
  );

  // this is hacky. should compare against SlateCreated events
  const proposalCreatedEvents = events.filter(
    event =>
      event.name === 'ProposalCreated' &&
      utils.getAddress(event.values.recipient) === utils.getAddress(address)
  );
  const proposalIncludedInSlateNotifications = await Promise.all(
    proposalCreatedEvents.map(async event => {
      const { proposer, recipient, metadataHash } = event.values;
      const proposalMetadata = await ipfs.get(utils.toUtf8String(metadataHash), {
        json: true,
      });
      return {
        ...notifications.PROPOSAL_INCLUDED_IN_SLATE,
        proposalID: proposalMetadata.id,
        event,
        proposer,
        recipient,
        slateID: '0', // TEMPORARY HACK
      };
    })
  );

  return slateAcceptedNotifications.concat(proposalIncludedInSlateNotifications);
}

module.exports = {
  getNormalizedNotificationsByEvents,
};
