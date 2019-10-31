import { Wallet } from 'ethers';
import { verifyMessage, getAddress } from 'ethers/utils';

import { Sequelize } from '../models';
import { hasDuplicates } from '.';
const {
  FundingCategory,
  CategoryPoll,
  CategoryPollOption,
  CategoryPollResponse,
  CategoryPollAllocation,
} = require('../models');
const { in: opIn } = Sequelize.Op;

// ===== Categories

export async function getCategories() {
  return FundingCategory.findAll();
}

export async function getCategoryByName(name: string) {
  return FundingCategory.findOne({ where: { displayName: name } });
}

// Throw if the category already exists
export async function createCategory(name: string) {
  const data = {
    displayName: name,
  };

  return FundingCategory.create(data);
}

// ===== Polls

/**
 * Return the poll with the options included
 * @param pollID
 */
export async function getPollByID(pollID: number) {
  return CategoryPoll.findOne({
    where: { id: pollID },
    include: [{ model: CategoryPollOption, as: 'options' }],
  });
}

export async function createEmptyPoll(name: string) {
  return CategoryPoll.create(
    { name },
    {
      include: [{ model: CategoryPollOption, as: 'options' }],
    }
  );
}

export async function createPoll(name: string, categoryNames: string[]) {
  // check that the categories are unique
  if (hasDuplicates(categoryNames)) {
    throw new Error('Duplicate categories');
  }

  // get categories matching the given strings
  const where = {
    displayName: {
      [opIn]: categoryNames,
    },
  };
  const categories = await FundingCategory.findAll({ where });
  if (categories.length !== categoryNames.length) {
    throw new Error('Invalid categories included');
  }

  // create poll with the given categories, return the poll with its options
  return CategoryPoll.create({
    name,
  }).then(poll => {
    const options = categories.map(cat => {
      return { pollID: poll.id, categoryID: cat.id };
    });
    return CategoryPollOption.bulkCreate(options).then(() =>
      poll.reload({
        include: [
          {
            model: CategoryPollOption,
            as: 'options',
          },
        ],
      })
    );
  });
}

/**
 * Add an option to an existing poll
 *
 * @param pollID
 * @param name
 * @returns poll with options included
 */
export async function addPollOption(pollID: number, name: string) {
  // throws if poll does not exist
  const poll = await CategoryPoll.findOne({ where: { id: pollID } });
  // console.log('FOUND POLL', poll.get({plain: true}));

  // get or create a category, then create an option
  return FundingCategory.findOrCreate({ where: { displayName: name } }).then(result => {
    const [category] = result;
    // console.log('CATEGORY', category.get({plain:true}));

    // associate it
    return CategoryPollOption.create({
      pollID: poll.id,
      categoryID: category.id,
    }).then(() => getPollByID(pollID));
  });
}

// ===== Responses

export interface IPollData {
  signature: string;
  response: IPollResponse;
}

export interface IPollResponse {
  account: string;
  pollID: number;
  allocations: ICategoryAllocation[];
}

export interface ICategoryAllocation {
  categoryID: number;
  points: number;
}

/**
 * Add a response to an existing poll
 * allocations must match the poll options
 * @param response
 * @returns newly created response
 */
export async function addPollResponse(response: IPollResponse) {
  return CategoryPollResponse.create(response, {
    include: [{ model: CategoryPollAllocation, as: 'allocations' }],
  });
}

export async function responseCount(pollID: number): Promise<number> {
  return CategoryPollResponse.count({ where: { pollID } });
}

// ===== Calculations
function ensureChecksumAddress(address: string): string {
  return getAddress(address.toLowerCase());
}

function generateMessage(response: IPollResponse): string {
  // Always use checksum address in the message
  const account = ensureChecksumAddress(response.account);
  return `Response from ${account} for poll ID ${response.pollID}`;
}

export async function verifyPollSignature(data: IPollData) {
  const { signature, response } = data;
  const { account } = response;

  const message = generateMessage(response);
  const recoveredAddress = verifyMessage(message, signature);
  console.log('recovered:', recoveredAddress);

  return ensureChecksumAddress(recoveredAddress) === ensureChecksumAddress(account);
}

export async function signResponse(wallet: Wallet, response: IPollResponse): Promise<string> {
  const message = generateMessage(response);
  // console.log(`signing message '${message}'`);
  return wallet.signMessage(message);
}

export async function createSignedResponse(
  wallet: Wallet,
  response: IPollResponse
): Promise<IPollData> {
  return signResponse(wallet, response).then(signature => {
    // console.log('signed', signature);
    return { response, signature };
  });
}
