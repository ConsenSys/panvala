export const PANVALA_STATE = 'PANVALA_STATE';
export const ENABLED_ACCOUNTS = 'ENABLED_ACCOUNTS';

export function saveState(store: string, state: any) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(store, serializedState);
  } catch (error) {
    console.warn('Warning: failed to set to local storage', state);
    // Ignore write errors.
  }
}

export function loadState(store: string) {
  try {
    const serializedState = localStorage.getItem(store);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
}
