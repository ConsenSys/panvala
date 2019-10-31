import { validatePollResponseStructure } from '../utils/validation';
import { addPollResponse, verifyPollSignature } from '../utils/polls';

// Return the newly created response
export async function saveResponse(req, res) {
  //
  const { response } = req.body;
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

  // Validate signature
  const validSignature = await verifyPollSignature(req.body);
  if (!validSignature) {
    return res.status(403).json({
      msg: 'Signature does not match account',
    });
  }

  return addPollResponse(response)
    .then(savedResponse => {
      return res.json(savedResponse);
    })
    .catch(error => {
      return res.status(400).json({
        msg: error.message,
      });
    });
}
