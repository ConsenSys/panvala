import { validatePollResponseStructure } from '../utils/validation';
import {
  addPollResponse,
  verifyPollSignature,
  hasAccountRespondedToPoll,
  IPollData,
  IDBPollResponse,
  ensureChecksumAddress,
  getPollByID,
} from '../utils/polls';

// Return the newly created response
export async function saveResponse(req, res) {
  const data: IPollData = req.body;
  const { pollID: rawPollID } = req.params;

  // If the given pollID does not represent a valid poll, return 404
  const { isValidPollID: isValid, pollID } = await validatePollID(rawPollID);
  if (!isValid) {
    return res.status(404).send();
  }

  // validate structure
  const valid = validatePollResponseStructure(req.body);

  if (!valid) {
    const msg = 'Invalid poll response request data';
    const errors = validatePollResponseStructure.errors;

    // console.error(errors);
    return res.status(400).json({
      msg,
      errors,
    });
  }

  const { response, signature } = data;

  const responseToSave: IDBPollResponse = {
    ...response,
    pollID,
  };

  // Validate signature
  const validSignature = await verifyPollSignature(signature, responseToSave);
  if (!validSignature) {
    return res.status(403).json({
      msg: 'Signature does not match account',
    });
  }

  return addPollResponse(responseToSave)
    .then(savedResponse => {
      return res.json(savedResponse);
    })
    .catch(error => {
      console.error(error);
      return res.status(400).json({
        msg: error.message,
      });
    });
}

export async function getUserStatus(req, res) {
  const { pollID: rawPollID } = req.params;
  let { account: rawAccount } = req.params;

  const { isValidPollID: isValid, pollID } = await validatePollID(rawPollID);
  if (!isValid) {
    return res.status(404).send();
  }

  const { isValidAddress, account } = await validateAddress(rawAccount);
  if (!isValidAddress) {
    return res.status(404).send();
  }

  return hasAccountRespondedToPoll(pollID, account)
    .then(responded => {
      const status = {
        responded,
      };
      return res.json(status);
    })
    .catch(error => {
      console.error(error);
      return res.status(500).json({
        msg: error.message,
      });
    });
}

// Helpers

async function validatePollID(
  rawPollID: string
): Promise<{ isValidPollID: boolean; pollID: number }> {
  const pollID: number = parseInt(rawPollID);
  const result = { isValidPollID: true, pollID };

  if (Number.isNaN(pollID)) {
    return { isValidPollID: false, pollID: null };
  }

  const poll = await getPollByID(pollID);
  if (poll == null) {
    return { isValidPollID: false, pollID: null };
  }

  return result;
}

function validateAddress(account: string): { isValidAddress: boolean; account: string } {
  try {
    account = ensureChecksumAddress(account);
  } catch (error) {
    console.error(error);
    return { isValidAddress: false, account };
  }

  return { isValidAddress: true, account };
}
