import { TransactionReceipt, TransactionResponse, Web3Provider } from 'ethers/providers';
import { LogDescription } from 'ethers/utils';
import { Contract, utils } from 'ethers';
import { ContractReceipt } from 'ethers/contract';
import { BasicToken, Gatekeeper, TokenCapacitor, ParameterStore } from '../types';
import { abiEncode } from './values';
import { IGovernanceProposalInfo } from '../interfaces';

export interface IMinedTransaction {
  receipt: TransactionReceipt;
  decodedLogs?: LogDescription[];
}

export async function sendApproveTransaction(
  token: BasicToken,
  address: string,
  numTokens: utils.BigNumberish
): Promise<TransactionResponse> {
  return token.functions.approve(address, numTokens.toString());
}

export async function sendStakeTokensTransaction(
  gatekeeper: Gatekeeper,
  slateID: number
): Promise<TransactionResponse> {
  return gatekeeper.functions.stakeTokens(slateID);
}

export async function sendCreateManyProposalsTransaction(
  tokenCapacitor: TokenCapacitor,
  beneficiaries: string[],
  tokenAmounts: string[],
  proposalMultihashes: Buffer[]
): Promise<TransactionResponse> {
  return (tokenCapacitor as any).functions.createManyProposals(
    beneficiaries,
    tokenAmounts,
    proposalMultihashes
  );
}

/**
 * Send a Tx to a Contract
 * Wait for Tx to get mined
 * Return Tx receipt and decoded logs (optionally filtered for specified event name)
 */
export async function sendAndWaitForTransaction(
  provider: Web3Provider,
  contract: Contract,
  method: string,
  inputs: any[],
  eventName: string = ''
): Promise<IMinedTransaction | void> {
  // send the tx
  return contract.functions[method](...inputs)
    .then((response: TransactionResponse) => {
      // wait for tx to get mined
      return provider.waitForTransaction((response as any).hash);
    })
    .then((receipt: TransactionReceipt) => {
      let decodedLogs: LogDescription[] | undefined;
      if (receipt.logs) {
        // Get the logs from the receipt
        decodedLogs = receipt.logs
          .map(log => {
            // decode the logs
            return contract.interface.parseLog(log);
          })
          .filter(d => d !== null);
        if (eventName) {
          // filter for the specified event name
          decodedLogs = decodedLogs.filter(d => d.name == eventName);
        }
      }
      return {
        decodedLogs,
        receipt,
      };
    })
    .catch((error: any) => {
      console.log('send tx error:', error);
    });
}

// Submit requestIDs and metadataHash to the Gatekeeper.
export async function sendRecommendGovernanceSlateTx(
  gatekeeper: Gatekeeper,
  parameterStoreAddress: string,
  requestIDs: any[],
  metadataHash: string,
  setTxPending: any
): Promise<any> {
  setTxPending(true);
  const response = await (gatekeeper as any).functions.recommendSlate(
    parameterStoreAddress,
    requestIDs,
    Buffer.from(metadataHash)
  );

  const receipt: ContractReceipt = await response.wait();
  setTxPending(false);

  if (typeof receipt.events !== 'undefined') {
    // Get the SlateCreated logs from the receipt
    // Extract the slateID
    const slateID = receipt.events
      .filter((event: any) => event.event === 'SlateCreated')
      .map((event: any) => event.args.slateID.toString());

    const slate: any = { slateID: utils.bigNumberify(slateID).toString(), metadataHash };
    return slate;
  }
}

// Submit proposals to the token capacitor and get corresponding request IDs
export async function sendCreateManyGovernanceProposals(
  parameterStore: ParameterStore,
  proposalInfo: IGovernanceProposalInfo,
  setTxPending: any
): Promise<any> {
  const { metadatas, multihashes } = proposalInfo as any;
  const keys: string[] = metadatas.map((p: any) => p.parameterChanges.key);
  const values: string[] = metadatas.map((p: any) =>
    abiEncode(p.parameterChanges.type, p.parameterChanges.newValue)
  );
  // submit to the capacitor, get requestIDs
  console.log('keys, values:', keys, values);
  setTxPending(true);
  // prettier-ignore
  const response: TransactionResponse = await parameterStore.functions.createManyProposals(keys, values, multihashes);

  // wait for tx to get mined
  const receipt: ContractReceipt = await response.wait();
  setTxPending(false);

  if (typeof receipt.events !== 'undefined') {
    // Get the ProposalCreated logs from the receipt
    // Extract the requestID
    const requestIDs = receipt.events
      .filter((event: any) => event.event === 'ProposalCreated')
      .map((event: any) => utils.bigNumberify(event.args.requestID).toString());
    return requestIDs;
  }
}
