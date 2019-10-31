import { validatePollResponseStructure } from '../utils/validation';
import { addPollResponse } from '../utils/polls';

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

  // TODO: validate signature

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
