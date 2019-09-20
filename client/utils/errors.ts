import { AxiosError } from 'axios';

interface ICustomApiError {
  msg?: string;
  errors?: any[];
}

export function handleApiError(error: AxiosError) {
  let toastMessage;

  // axios errors have a `response` field that contains the error details
  // -> use it to unpack and display more informative, custom errors
  // https://github.com/axios/axios/issues/960#issuecomment-309287911
  let data: string | ICustomApiError = error.response && error.response.data;
  console.log('error.response.data:', data);

  if (
    typeof data === 'string' &&
    data === 'Improper ballot format: SequelizeUniqueConstraintError: Validation error'
  ) {
    // singleVotePerEpoch
    toastMessage = 'Failed to save ballot - only one vote allowed per epoch.';
  } else if (typeof data !== 'string' && data.msg && data.msg === 'Invalid ballot request data') {
    // invalid ballot data types
    toastMessage = 'Failed to process ballot - invalid ballot request.';
  } else {
    toastMessage = 'Unknown error';
  }

  return {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // error.response: { data, status, headers }
    response: error.response,
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    request: error.request,
    config: error.config,
    // Something happened in setting up the request that triggered an Error
    message: error.message,
    // custom message for toasts
    toastMessage,
  };
}

export enum PanvalaError {
  TransactionRejected,
  TransactionFailed, // Revert
  NotLoggedIn,
  SignatureRejected,
  Unknown,
}

export const ETHEREUM_NOT_AVAILABLE = 'Ethereum not available';

/**
 * Try to handle the error generically. Return a PanvalaError if the error isn't handled.
 */
export function handleGenericError(error: Error, toast): PanvalaError | undefined {
  const errorType = checkError(error);
  if (errorType === PanvalaError.TransactionRejected) {
    toast.info('You rejected the transaction');
  } else if (errorType === PanvalaError.SignatureRejected) {
    toast.info('You declined to sign the message');
  } else if (errorType === PanvalaError.NotLoggedIn) {
    toast.error('Please log into MetaMask');
  } else {
    // Pass the message up to the caller -- toasts and other feedback should be handled there
    return errorType;
  }
}

function checkError(error: Error): PanvalaError {
  const { message: msg } = error;

  // RPC errors
  if (msg.includes('Internal JSON-RPC error')) {
    if (typeof error.stack !== 'undefined') {
      const { stack } = error;
      // MetaMask errors
      if (stack.includes('User denied transaction signature')) {
        return PanvalaError.TransactionRejected;
      } else if (stack.includes('User denied message signature')) {
        return PanvalaError.SignatureRejected;
      } else if (stack.includes('Invalid "from" address')) {
        return PanvalaError.NotLoggedIn;
      }

      // revert
    }
  } else if (msg.includes('Ethereum not available')) {
    return PanvalaError.NotLoggedIn;
  } else if (msg.includes('unknown account')) {
    // from ethers
    return PanvalaError.NotLoggedIn;
  }

  // TODO:
  // IPFS errors
  // API errors

  console.log('Unknown error', error);

  return PanvalaError.Unknown;
}
