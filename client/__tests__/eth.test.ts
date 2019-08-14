import { providers } from 'ethers';
import { BasicToken, Gatekeeper, TokenCapacitor, ParameterStore } from '../types';
import { evmSnapshot, evmRevert, toBaseUnits, tokenDistributions } from './helpers';
import { eth } from './eth';

describe('Tokens', () => {
  let accounts: string[],
    token: BasicToken,
    gatekeeper: Gatekeeper,
    tokenCapacitor: TokenCapacitor,
    parameterStore: ParameterStore,
    snapshotID: number,
    provider: providers.Web3Provider | providers.JsonRpcProvider,
    ganache: any;

  beforeAll(async () => {
    jest.setTimeout(30000);
    // prettier-ignore
    ({ ganache, provider, gatekeeper, token, tokenCapacitor, parameterStore } = await eth.initContracts());
    accounts = await provider.listAccounts();
  });
  beforeEach(async () => {
    jest.setTimeout(30000);
    snapshotID = await evmSnapshot(provider);
  });

  afterEach(() => evmRevert(provider, snapshotID));
  afterAll(() => ganache.close());

  test('should initiate the system with the correct values', async done => {
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber.toString()).toBe('9');

    const deployed = await gatekeeper.deployed();
    expect(deployed.functions).toHaveProperty('slates');

    const slateStakeAmount = await parameterStore.functions.getAsUint('slateStakeAmount');
    expect(slateStakeAmount.toString()).toBe(tokenDistributions.slateStakeAmount.toString());

    const tcBalance = await token.balanceOf(tokenCapacitor.address);
    expect(tcBalance.toString()).toBe(tokenDistributions.initialTcBalance.toString());

    const epochNumber = await gatekeeper.currentEpochNumber();
    expect(epochNumber.toString()).toBe('1');
    done();
  });

  test('should be able to send a transaction', async done => {
    const bal1 = await token.balanceOf(accounts[0]);
    expect(bal1.toString()).toBe(toBaseUnits('50000000').toString());

    await token.functions.transfer(accounts[1], toBaseUnits('420'));

    const bal2 = await token.balanceOf(accounts[0]);
    expect(bal2.toString()).toBe(toBaseUnits('49999580').toString());
    done();
  });

  test('should still be the same blockNumber and balance 50M after reverting to the snapshot', async done => {
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber.toString()).toBe('9');

    const bal = await token.balanceOf(accounts[0]);
    expect(bal.toString()).toBe(toBaseUnits('50000000').toString());
    done();
  });
});
