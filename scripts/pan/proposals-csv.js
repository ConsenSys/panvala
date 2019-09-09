const ethers = require('ethers');
const fs = require('fs');
const stringify = require('csv-stringify/lib/sync');

const { prepareContracts, fetchSlate, assembleGrantSlate } = require('./lib');
const { bigNumberify } = ethers.utils;

run();

async function slateToCSV(slate) {
  const rows = slate.proposals.map(proposal => {
    const { title } = proposal.metadata;
    const { to: recipient, tokens } = proposal;
    // console.log(proposal.metadata);
    return [recipient, ethers.utils.formatUnits(tokens, 18), title];
  });

  const data = stringify(rows, { header: true, columns: ['Recipient', 'Tokens', 'Title'] });
  return data;
}

async function run() {
  // parse args
  const argv = process.argv;
  // console.log(argv);

  if (argv.length === 3) {
    const slateID = bigNumberify(argv[2]);
    console.log('slateID', slateID.toString());

    const contracts = await prepareContracts();
    const { gatekeeper, tokenCapacitor, parameterStore, provider } = contracts;
    const slateCount = await gatekeeper.slateCount();

    if (slateCount.eq(0)) {
      console.error('No slates have been created yet');
    } else if (slateID.gte(slateCount)) {
      console.error(`Invalid slateID. Must be no greater than ${slateCount.sub(1)}.`);
    } else {
      // console.log(slateCount.toString(), 'slates');
      const slate = await fetchSlate(contracts, slateID);

      if (slate.resource === tokenCapacitor.address) {
        const enrichedSlate = await assembleGrantSlate(
          provider,
          gatekeeper,
          tokenCapacitor,
          slate,
          slateID
        );

        // write to CSV
        const csv = await slateToCSV(enrichedSlate);
        console.log(csv);
        console.log('writing csv');
        // write to a file
        fs.writeFileSync(`slate-${slateID.toString()}.csv`, csv);
        // describeSlate(enrichedSlate);
      } else if (slate.resource === parameterStore.address) {
        console.log('Governance slate');
      }
    }
  } else {
    console.log('usage');
    console.log('short');
    console.log('no slate ID specified');
  }
}
