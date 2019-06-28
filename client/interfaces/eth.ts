import { BasicToken, Gatekeeper, TokenCapacitor, ParameterStore } from '../types';

export interface IContracts {
  tokenCapacitor: TokenCapacitor;
  gatekeeper: Gatekeeper;
  token: BasicToken;
  parameterStore: ParameterStore;
}
