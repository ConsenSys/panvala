export { voting, contractABIs, timing } from 'panvala-utils';

export function hasDuplicates(array: any[]): boolean {
  const counter = {};

  for (const element of array) {
    const stored = counter[element];
    if (stored == null) {
      counter[element] = 1;
    } else {
      if (stored === 1) {
        return true;
      }
    }
  }

  return false;
}
