import { getParametersSet } from '../utils/events';

export async function getAll(req, res) {
  // get parameter store events
  const params = await getParametersSet(undefined);
  console.log('params:', params);

  res.send(JSON.stringify(params));
}
