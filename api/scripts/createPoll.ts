import { getCategories, createPoll } from '../src/utils/polls';
import { sequelize } from '../src/models';

sequelize.options.logging = false;

// TODO: allow the user to create polls with just some of the categories
// TODO: allow the user to add new categories

async function run() {
  // if there are no categories, prompt the user to create them
  const categories = await getCategories();
  if (categories.length === 0) {
    console.log('No funding categories found');
    console.log('');
    console.log("> Did you remember to run 'yarn seed'?");
    process.exit(0);
  }

  // create the poll
  console.log('creating poll');
  const name = 'A poll';
  const categoryNames = categories.map(c => c.displayName);

  const poll = await createPoll(name, categoryNames);

  console.log(`created poll ${name} with id ${poll.id}`);
  // console.log(poll.get({ plain: true }));
  process.exit(0);
}

run();
