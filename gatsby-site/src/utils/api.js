import { getEndpointAndHeaders } from './donate';

export async function getEpochDates() {
  const { endpoint, headers } = getEndpointAndHeaders();
  const route = `${endpoint}/api/epochs/current/dates`;
  const result = await getData(route, headers);
  console.log('result:', result);
  return result;
}

export async function getData(endpoint, headers) {
  return fetch(endpoint, { headers }).then(res => res.json());
}
