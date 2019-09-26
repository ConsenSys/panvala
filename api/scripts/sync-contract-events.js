const { syncEvents, listenAndSyncContractEvents } = require('../utils/events');

function usage() {
  console.log('Usage: node sync-contract-events.js [--listen]');
}

async function run() {
  if (process.argv.length === 2) {
    // sync once
    console.log('Syncing Panvala contract events to the database');
    await syncEvents();
  } else if (process.argv.length === 3) {
    const command = process.argv[2];
    if (command.includes('listen')) {
      console.log('Listening for Panvala contract events to sync to the database');
      await listenAndSyncContractEvents();
    }
  } else {
    usage();
  }
}

run();
