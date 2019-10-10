import * as models from '../models';
import { getAllSlates } from './slates';

const { Request, Sequelize } = models;
const { in: opIn } = Sequelize.Op;

// workaround for now. we should really be caching events and getting them from the db
async function mapRequestsToProposals(events, gatekeeper) {
  const proposalCreatedEvents = events.filter(e => e.name === 'ProposalCreated');
  const slates = await getAllSlates();

  await Promise.all(
    slates.map(async slate => {
      const slateRequests = await gatekeeper.slateRequests(slate.id);

      await Promise.all(
        slateRequests.map(async requestID => {
          const matchEvent = proposalCreatedEvents.find(
            e => e.values.requestID.toString() === requestID.toString()
          );

          if (matchEvent) {
            await Request.findOrCreate({
              where: {
                requestID: requestID.toString(),
                proposalID: matchEvent.values.proposalID.toString(),
                resource: matchEvent.recipient,
                metadataHash: matchEvent.values.metadataHash,
              },
              defaults: {
                requestID: requestID.toString(),
                proposalID: matchEvent.values.proposalID.toString(),
                resource: matchEvent.recipient, // this is tx.to, which will always be the event-emitting contract in our case
                metadataHash: matchEvent.values.metadataHash,
              },
            });
          }
        })
      );
    })
  );
}

// Find proposals matching the given resource and request IDs
async function getProposalsForRequests(resource, requestIDs) {
  if (requestIDs.length === 0) return Promise.resolve([]);

  const where = { resource };
  where['requestID'] = {
    [opIn]: requestIDs,
  };

  return Request.findAll({
    where,
  });
}

export { mapRequestsToProposals, getProposalsForRequests };
