import { validatePollResponseStructure } from '../utils/validation';
import {
  addPollResponse,
  verifyPollSignature,
  hasAccountRespondedToPoll,
  IPollData,
  IDBPollResponse,
  ensureChecksumAddress,
} from '../utils/polls';

// Return the newly created response
export async function saveResponse(req, res) {
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

  const data: IPollData = req.body;
  const { response, signature } = data;
  const { pollID } = req.params;

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
  const { pollID } = req.params;
  let { account } = req.params;

  try {
    account = ensureChecksumAddress(account);
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      msg: `Invalid Ethereum address '${account}'`,
    });
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
