let provider, selectedAccount, ipfs, Buffer, token, tokenCapacitor, exchange;

document.addEventListener('DOMContentLoaded', () => {
  // setup event listeners
  const submitButton = document.getElementById('donation-pledge-button');
  submitButton.addEventListener('click', handleClickSubmit);
  const closeModalButton = document.getElementById('donation-pledge-modal-close');
  closeModalButton.addEventListener('click', handleClickClose);

  loadEtherum();
});

function handleClickClose(e) {
  e.preventDefault();
  const modal = document.getElementById('donation-pledge-modal');
  modal.setAttribute('class', 'vh-100 dn w-100 bg-black-80 absolute--fill absolute z-999');
}

function handleClickSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById('donation-pledge-modal');
  modal.setAttribute('class', 'vh-100 dt w-100 bg-black-80 absolute--fill absolute z-999');
}

const {
  utils: { parseEther, formatEther, parseUnits, formatUnits, bigNumberify },
} = ethers;

function BN(small) {
  return bigNumberify(small);
}

async function loadEtherum() {
  // helpers
  if (typeof window.IpfsHttpClient !== 'undefined') {
    const Ipfs = window.IpfsHttpClient;
    Buffer = Ipfs.Buffer;
    ipfs = new Ipfs({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  }

  // setup ethereum
  await setSelectedAccount();
  await setContracts();

  // setup event listener
  const donateButton = document.getElementById('donate-button');
  donateButton.addEventListener('click', handleClickDonate);
}

async function setSelectedAccount() {
  if (typeof window.ethereum !== 'undefined') {
    if (!provider) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    selectedAccount = (await provider.listAccounts())[0];
    // user not enabled for this app
    if (!selectedAccount) {
      window.ethereum.enable().then(enabled => {
        selectedAccount = enabled;
      });
    }
    return selectedAccount;
  }
}

async function setContracts() {
  if (typeof provider !== 'undefined') {
    const signer = provider.getSigner();
    token = new ethers.Contract('0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44', tokenAbi, signer);
    tokenCapacitor = new ethers.Contract(
      '0xad6E0b491F48F5fACc492b9165c0A38121202756',
      tcAbi,
      signer
    );
    const { chainId } = await provider.getNetwork();
    const exchangeAddress =
      chainId === 4
        ? '0x103Bf69E174081321DE44cBA78F220F5d30931e8'
        : chainId === 1
        ? '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7'
        : '';
    exchange = new ethers.Contract(exchangeAddress, exchangeABI, signer);
  } else {
    const account = await setSelectedAccount();
    if (account) {
      await setContracts();
    } else {
      alert('You must login to MetaMask.');
      return;
    }
  }
}

async function checkAllowance(numTokens) {
  const allowance = await token.functions.allowance(selectedAccount, tokenCapacitor.address);
  return allowance.gte(numTokens);
}

async function fetchEthPrice() {
  const result = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot?currency=USD');
  const json = await result.json();
  const ethPrice = json.data.amount;
  return ethPrice;
}

function quoteUsdToEth(usdAmount, ethPrice) {
  console.log(`1 ETH: $${ethPrice}`);
  return parseInt(usdAmount, 10) / parseInt(ethPrice, 10);
}

// Sell order (exact input) -> calculates amount bought (output)
async function quoteEthToPan(etherToSpend) {
  // Sell ETH for PAN
  const inputAmount = etherToSpend;
  // ETH reserve
  const inputReserve = await provider.getBalance(exchange.address);
  // PAN reserve
  const outputReserve = await token.balanceOf(exchange.address);

  // Output amount bought
  const numerator = inputAmount.mul(outputReserve).mul(997);
  const denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
  const panToReceive = numerator.div(denominator);

  return panToReceive;
}

// Sell PAN for ETH
// const panAmount = '200000';
// const baseAmount = parseUnits(panAmount, 18);
// const weiQuote = await quotePanToEth(baseAmount);
// const ethQuote = formatEther(weiQuote);
// console.log(`${panAmount} PAN -> ${ethQuote.toString()} ETH`);
async function quotePanToEth(panToSell) {
  // Sell PAN for ETH
  const inputAmount = panToSell;
  // PAN reserve
  const inputReserve = await token.balanceOf(exchange.address);
  // ETH reserve
  const outputReserve = await provider.getBalance(exchange.address);

  // Output amount bought
  const numerator = inputAmount.mul(outputReserve).mul(997);
  const denominator = inputReserve.mul(1000).add(inputAmount.mul(997));
  const ethToReceive = numerator.div(denominator);

  return ethToReceive;
}

function ipfsAdd(obj) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(obj));

    ipfs.add(data, (err, result) => {
      if (err) reject(new Error(err));
      const { hash } = result[0];
      resolve(hash);
    });
  });
}

async function handleClickDonate(e) {
  e.preventDefault();

  // make sure ethereum is hooked up properly
  if (!selectedAccount) {
    const account = await setSelectedAccount();
    if (!account) {
      alert('You must be logged into MetaMask.');
      return;
    }
  }

  const pledgeTierSelect = document.getElementById('pledge-tier-select');
  const pledgeDurationSelect = document.getElementById('pledge-duration-select');

  if (pledgeTierSelect.value === '0') {
    alert('You must select a pledge tier.');
    return;
  }
  if (pledgeDurationSelect.value === '0') {
    alert('You must select a pledge duration.');
    return;
  }

  const pledgeTier = parseInt(pledgeTierSelect.value, 10);
  const pledgeDuration = parseInt(pledgeDurationSelect.value, 10);

  const usdAmount = pledgeTier * pledgeDuration;
  const ethPrice = await fetchEthPrice();
  const ethAmount = quoteUsdToEth(usdAmount, ethPrice).toString();
  console.log(`${usdAmount} USD -> ${ethAmount} ETH`);

  const weiAmount = parseEther(ethAmount);
  const panQuoteBase = await quoteEthToPan(weiAmount);
  const panQuote = formatUnits(panQuoteBase, 18);
  console.log(`${ethAmount} ETH -> ${panQuote.toString()} PAN`);

  const data = {
    donor: selectedAccount,
    panAmount: panQuote.toString(),
    ethValue: ethAmount,
    ethPriceUSD: ethPrice,
    pledgeTotalUSD: usdAmount,
    pledgeTierUSD: pledgeTier,
    pledgeDuration,
  };
  console.log('data:', data);

  // const multihash = await ipfsAdd(data);
  // console.log('multihash:', multihash);

  // const receipt = await donatePan(data, multihash);
  // console.log('receipt:', receipt);
}

async function donatePan(data, multihash) {
  const allowed = await checkAllowance(data.panAmount);
  if (allowed) {
    console.log('tokenCapacitor:', tokenCapacitor);
    return tokenCapacitor.functions.donate(data.donor, data.panAmount, Buffer.from(multihash), {
      gasLimit: '0x6AD790',
      // gasPrice: '0x77359400',
    });
  } else {
    await token.functions.approve(tokenCapacitor.address, data.panAmount);
    return donatePan(data);
  }
}
