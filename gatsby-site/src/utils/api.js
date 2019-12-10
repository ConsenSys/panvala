import { getEndpointAndHeaders } from './donate';

export async function getEpochDates() {
  const { endpoint, headers } = getEndpointAndHeaders();
  const route = `${endpoint}/api/epochs/current/dates`;
  const result = await getData(route, headers);
  console.log('epoch dates result:', result);
  return result;
}

export async function getBudgets() {
  const { endpoint, headers } = getEndpointAndHeaders();
  const route = `${endpoint}/api/token/budget`;
  const result = await getData(route, headers);
  console.log('budgets result:', result);
  return result;
}

export async function getData(endpoint, headers) {
  return fetch(endpoint, { headers }).then(res => res.json());
}
