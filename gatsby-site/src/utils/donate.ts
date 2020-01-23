import { utils } from 'ethers';
import { toUSDCents } from './format';

const { bigNumberify, parseUnits, formatEther, formatUnits } = utils;

// Types
export interface IMetadata {
  version?: string;
  memo?: string;
  usdValue?: string;
  ethValue?: string;
  pledgeMonthlyUSD: number;
  pledgeTerm?: number;
}

export interface IAutopilotDonation extends IMetadata {
  txHash: string;
  multihash: string;
}

// TODO: extract types to a separate module
// Base transaction info -- all required
export interface IDonationTx {
  txHash: string;
  metadataHash: string;
  sender: string;
  donor: string;
  tokens: string;
}

export interface IAPIDonation extends IDonationTx {
  metadataVersion?: string;
  memo?: string;
  usdValueCents?: string;
  ethValue?: string;
  pledgeMonthlyUSDCents?: number;
  pledgeTerm?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
}

// Functions
export function BN(small) {
  return bigNumberify(small);
}

export async function checkAllowance(token, owner, spender, numTokens) {
  const allowance = await token.functions.allowance(owner, spender);
  return allowance.gte(numTokens);
}

export async function fetchEthPrice() {
  const result = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
  const json = await result.json();
  const ethPrice = json.data.amount;
  return ethPrice;
}

export function quoteUsdToEth(pledgeTotalUSD, ethPrice) {
  console.log(`1 ETH: ${ethPrice} USD`);
  return parseInt(pledgeTotalUSD, 10) / parseInt(ethPrice, 10);
}

export function trimUsdToEthPrice(tier, price) {
  return (tier / price).toString().slice(0, 5);
}

export function getEndpointAndHeaders() {
  const urlRoute = window.location.href;
  const endpoint =
    urlRoute.includes('staging/donate') || urlRoute.includes('develop.panvala')
      ? 'https://staging-api.panvala.com'
      : urlRoute.includes('localhost')
      ? 'http://localhost:5001'
      : 'https://api.panvala.com';

  const corsHeaders = {
    'Access-Control-Allow-Origin': endpoint,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type',
  };
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...corsHeaders,
  };
  return { endpoint, headers };
}

export function getTier(monthUSD) {
  console.log('monthUSD:', monthUSD);
  switch (monthUSD) {
    case '5':
      return 'Student';
    case '15':
      return 'Gold';
    case '50':
      return 'Platinum';
    case '150':
      return 'Diamond';
    case '500':
      return 'Ether';
    case '1500':
      return 'Elite';
    default:
      throw new Error('invalid tier');
  }
}

export async function getGasPrice(speed = 'fast') {
  const res = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
  const gasPrices = await res.json();
  console.log('gasPrices:', gasPrices);
  let gasPrice;
  if (gasPrices && gasPrices.hasOwnProperty(speed)) {
    gasPrice = parseUnits((gasPrices[speed] / 10).toString(), 'gwei');
  } else if (gasPrices && gasPrices.hasOwnProperty('fast')) {
    gasPrice = parseUnits((gasPrices.fast / 10).toString(), 'gwei');
  } else {
    gasPrice = parseUnits('12', 'gwei');
  }
  return gasPrice.toHexString();
}

export async function postAutopilot(
  email: string,
  firstName: string,
  lastName: string,
  txData: IAutopilotDonation,
  pledgeType = 'donation'
) {
  const postData = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    txHash: txData.txHash,
    memo: txData.memo,
    usdValue: txData.usdValue,
    ethValue: txData.ethValue,
    pledgeMonthlyUSD: txData.pledgeMonthlyUSD,
    pledgeTerm: txData.pledgeTerm,
    multihash: txData.multihash,
    pledgeType,
  };
  const { endpoint, headers } = getEndpointAndHeaders();
  const url = `${endpoint}/api/website`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(postData),
    headers,
  });
  const json = await res.json();
  console.log('contact:', json);
  return true;
}

// Sell order (exact input) -> calculates amount bought (output)
export async function quoteEthToPan(etherToSpend: utils.BigNumber, provider, { token, exchange }) {
  console.log('');
  // Sell ETH for PAN
  const ethAmount = BN(etherToSpend);

  // ETH reserve
  const inputReserve = await provider.getBalance(exchange.address);
  console.log(`ETH reserve: ${formatEther(inputReserve)}`);

  // PAN reserve
  const outputReserve = await token.balanceOf(exchange.address);
  console.log(`PAN reserve: ${formatUnits(outputReserve, 18)}`);

  const numerator = ethAmount.mul(outputReserve).mul(997);
  const denominator = inputReserve.mul(1000).add(ethAmount.mul(997));
  const panToReceive = numerator.div(denominator);

  console.log(
    `quote ${formatEther(ethAmount)} ETH : ${formatUnits(panToReceive.toString(), 18)} PAN`
  );
  // EQUIVALENT, DIRECT CHAIN CALL
  // PAN bought w/ input ETH
  // const panToReceive = await this.exchange.getEthToTokenInputPrice(ethAmount);
  // console.log(`${formatEther(ethAmount)} ETH -> ${formatUnits(panToReceive, 18)} PAN`);
  return panToReceive;
}

// Post to donations API
export async function postDonation(donationData: IAPIDonation) {
  const { endpoint, headers } = getEndpointAndHeaders();
  const url = `${endpoint}/api/donations`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(donationData),
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    console.error(json);

    const { msg, errors } = json;
    throw new Error(`${msg}: ${errors}`);
  }
  console.log('saved donation:', json);
  return true;
}

/**
 *  Prepare donation data for API call
 */
export function formatDonation(
  txInfo: IDonationTx,
  ipfsMetadata: IMetadata,
  userInfo,
  extraData,
): IAPIDonation {
  const pledgeMonthlyUSD = parseInt(toUSDCents(ipfsMetadata.pledgeMonthlyUSD.toString()));
  const { tokens } = txInfo;
  const { company } = userInfo;
  const { version, memo, ethValue, pledgeTerm } = ipfsMetadata;

  // api/src/utils/donations.IDonation
  const donationData = {
    ...txInfo,
    ...userInfo,
    ...extraData,
    tokens: tokens.toString(),
    metadataVersion: version,
    memo,
    usdValueCents: toUSDCents(ipfsMetadata.usdValue),
    ethValue,
    pledgeMonthlyUSDCents: pledgeMonthlyUSD,
    pledgeTerm,
  };

  if (company != null) {
    donationData.company = company;
  }

  return donationData;
}
