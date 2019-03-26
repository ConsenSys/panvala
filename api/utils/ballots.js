const {
  isEthereumAddress,
  isObject,
  nonEmptyString,
  isBigNumber
} = require('./validation');

const validBN = {
  ...nonEmptyString,
  custom: {
    options: isBigNumber,
  }
};


/**
 * Ballot data received in a POST request
 {
   ballot: {
     epochNumber: Number,
     choices: {
       0: { firstChoice: String, secondChoice: String },
       1: { firstChoice: String, secondChoice: String },
     },
     salt: String (BigNumber),
     voterAddress: String,
   }
   signature: String,
 }
 *
 */
const ballotSchema = {
  // ballot data
  'ballot.epochNumber': {
    in: ['body'],
    ...validBN,
  },
  'ballot.salt': {
    in: ['body'],
    ...validBN,
  },
  'ballot.voterAddress': {
    in: ['body'],
    ...nonEmptyString,
    custom: {
      options: isEthereumAddress,
    },
  },
  'ballot.choices': {
    in: ['body'],
    exists: true,
    custom: {
      options: isObject,
    },
  },

  // vote choices
  'ballot.choices.*.firstChoice': {
    in: ['body'],
    isNull: false,
    ...validBN,
  },
  'ballot.choices.*.secondChoice': {
    in: ['body'],
    ...validBN,
  },

  // signature of the ballot data
  signature: {
    in: ['body'],
    ...nonEmptyString,
  },
};

/**
 * Ballot data to be fed to the ORM
 {
   epochNumber: String,
   salt: String,
   voterAddress: String,
   signature: String,
   salt: String,
   voteChoices: [
     {
       firstChoice: String,
       secondChoice: String,
     }
   ],
 }
 */
const ballotInsertSchema = {
  // ballot data
  epochNumber: {
    in: ['body'],
    ...nonEmptyString,
    isInt: true,
  },
  voterAddress: {
    in: ['body'],
    ...nonEmptyString,
    custom: {
      options: isEthereumAddress,
    },
  },
  salt: {
    in: ['body'],
    ...nonEmptyString,
    // isInt: true,
  },

  // vote choices
  'voteChoices.*.firstChoice': {
    in: ['body'],
    isNull: false,
    ...nonEmptyString,
  },
  'voteChoices.*.secondChoice': {
    in: ['body'],
    ...nonEmptyString,
  },
  'voteChoices.*.salt': {
    in: ['body'],
    ...nonEmptyString,
  },

  // signature of the ballot data
  signature: {
    in: ['body'],
    ...nonEmptyString,
  },
};

module.exports = {
  ballotSchema,
  ballotInsertSchema,
};
