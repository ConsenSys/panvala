import * as models from '../models';
const { Proposal } = models;

function initProposals() {
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

export { initProposals };
