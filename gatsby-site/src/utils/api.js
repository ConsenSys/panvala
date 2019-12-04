export async function getEpochDates() {
  const endpoint = `http://localhost:5001/api/epochs/current/dates`;
  const result = await getData(endpoint);
  console.log('result:', result);
  return result;
}

export async function getData(endpoint) {
  return fetch(endpoint).then(res => res.json());
}
