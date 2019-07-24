export const LINKED_WALLETS = 'LINKED_WALLETS';
export const ENABLED_ACCOUNTS = 'ENABLED_ACCOUNTS';
export const CLOSED_MAINNET_MODAL = 'CLOSED_MAINNET_MODAL';

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

export function saveSessionState(store: string, state: string) {
  try {
    sessionStorage.setItem(store, state);
  } catch (error) {
    console.warn('Warning: failed to set to local storage', state);
    // Ignore write errors.
  }
}

export function loadSessionState(store: string) {
  try {
    const serializedState = sessionStorage.getItem(store);
    if (serializedState === null) {
      return undefined;
    }
    return serializedState;
  } catch (err) {
    return undefined;
  }
}
