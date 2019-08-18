const { Request } = require('../models');
const { getAllSlates } = require('./slates');

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
            await Request.create({
              requestID: requestID.toString(),
              proposalID: matchEvent.values.proposalID.toString(),
              resource: matchEvent.recipient, // this is tx.to, which will always be the event-emitting contract in our case
              metadataHash: matchEvent.values.metadataHash,
            });
          }
        })
      );
    })
  );
}

module.exports = {
  mapRequestsToProposals,
};
