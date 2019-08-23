const readline = require('readline');
const { SubmittedBallot, Slate, IpfsMetadata, Request } = require('../models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const tables = {
  Slate: Slate,
  SubmittedBallot: SubmittedBallot,
  IpfsMetadata: IpfsMetadata,
  Request: Request,
};

(async function nukedb() {
  await nukeTable('Slate');
  await nukeTable('SubmittedBallot');
  await nukeTable('IpfsMetadata');
  await nukeTable('Request');

  rl.close();
  process.exit(0);
})();

async function nukeTable(table) {
  return new Promise(resolve => {
    rl.question(`Do you want to truncate the ${table}s table? [y/N]`, async answer => {
      if (answer === 'y') {
        console.log(`nuking ${table}s...`);
        await tables[table].truncate({
          cascade: true,
          restartIdentity: true,
        });
      } else {
        console.log(`Skipping truncation of ${table}s table`);
      }
      console.log();

      resolve();
    });
  });
}
