let ethProvider, selectedAccount, ipfs, Buffer, token, tokenCapacitor;

document.addEventListener('DOMContentLoaded', () => {
  // setup event listeners
  const submitButton = document.getElementById('email-subscribe-button');
  submitButton.addEventListener('click', handleClickSubmit);
  const closeModalButton = document.getElementById('email-subscribe-modal-close');
  closeModalButton.addEventListener('click', handleClickClose);

  loadEtherum();
});

function handleClickClose(e) {
  e.preventDefault();
  const modal = document.getElementById('email-subscribe-modal');
  modal.setAttribute('class', 'vh-100 dn w-100 bg-black-80 absolute--fill absolute z-999');
}

function handleClickSubmit(e) {
  e.preventDefault();
  const emailSubscribeInput = document.getElementById('email-subscribe-input');
  if (validateEmail(emailSubscribeInput.value)) {
    const modal = document.getElementById('email-subscribe-modal');
    modal.setAttribute('class', 'vh-100 dt w-100 bg-black-80 absolute--fill absolute z-999');
  } else {
    console.log('invalid email');
  }
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const tcAbi = [
  {
    constant: true,
    inputs: [{ name: '', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'gatekeeper', type: 'address' },
      { name: 'requestID', type: 'uint256' },
      { name: 'tokens', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'metadataHash', type: 'bytes' },
      { name: 'withdrawn', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'parameters',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'lastLockedTime',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'lifetimeReleasedTokens',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'unlockedBalance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'lastLockedBalance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_parameters', type: 'address' },
      { name: '_token', type: 'address' },
      { name: 'initialUnlockedBalance', type: 'uint256' },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'proposalID', type: 'uint256' },
      { indexed: true, name: 'proposer', type: 'address' },
      { indexed: false, name: 'requestID', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'tokens', type: 'uint256' },
      { indexed: false, name: 'metadataHash', type: 'bytes' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'proposalID', type: 'uint256' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'numTokens', type: 'uint256' },
    ],
    name: 'TokensWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'payer', type: 'address' },
      { indexed: true, name: 'donor', type: 'address' },
      { indexed: false, name: 'numTokens', type: 'uint256' },
      { indexed: false, name: 'metadataHash', type: 'bytes' },
    ],
    name: 'Donation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'unlockedBalance', type: 'uint256' },
      { indexed: false, name: 'lastLockedBalance', type: 'uint256' },
      { indexed: false, name: 'lastLockedTime', type: 'uint256' },
      { indexed: false, name: 'totalBalance', type: 'uint256' },
    ],
    name: 'BalancesUpdated',
    type: 'event',
  },
  {
    constant: false,
    inputs: [{ name: 'proposalID', type: 'uint256' }],
    name: 'withdrawTokens',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'donor', type: 'address' },
      { name: 'tokens', type: 'uint256' },
      { name: 'metadataHash', type: 'bytes' },
    ],
    name: 'donate',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'time', type: 'uint256' }],
    name: 'projectedUnlockedBalance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'time', type: 'uint256' }],
    name: 'projectedLockedBalance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];
const tokenAbi = [
  {
    constant: false,
    inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
];

async function loadEtherum() {
  console.log('window:', window);
  console.log('window.ethereum:', window.ethereum);
  console.log('ethers:', ethers);
  // helpers
  if (typeof window.IpfsHttpClient !== 'undefined') {
    const Ipfs = window.IpfsHttpClient;
    Buffer = Ipfs.Buffer;
    ipfs = new Ipfs({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  }

  // setup ethereum
  setSelectedAccount();
  setContracts();

  // setup event listener
  const donateButton = document.getElementById('donate');
  donateButton.addEventListener('click', handleClickDonate);
}

async function setSelectedAccount() {
  if (typeof window.ethereum !== 'undefined') {
    if (!ethProvider) {
      ethProvider = new ethers.providers.Web3Provider(window.ethereum);
    }
    selectedAccount = (await ethProvider.listAccounts())[0];
    // user not enabled for this app
    if (!selectedAccount) {
      window.ethereum.enable().then(enabled => {
        selectedAccount = enabled;
      });
    }
  }
}

function setContracts() {
  if (typeof ethProvider !== 'undefined') {
    token = new ethers.Contract(
      '0x37d496765354c8fd7108a8828a60e19e8d9b55bd',
      tokenAbi,
      ethProvider.getSigner()
    );
    tokenCapacitor = new ethers.Contract(
      '0xad6E0b491F48F5fACc492b9165c0A38121202756',
      tcAbi,
      ethProvider.getSigner()
    );
  } else {
    setSelectedAccount();
    setContracts();
  }
}

async function handleClickDonate(e) {
  e.preventDefault();

  // make sure ethereum is hooked up properly
  setSelectedAccount();

  const amount = '50000';
  const data = {
    donor: selectedAccount,
    panAmount: ethers.utils.parseUnits(amount, 18).toString(),
  };

  const multihash = await ipfsAdd(data);
  console.log('multihash:', multihash);

  const receipt = await donatePan(data, multihash);
  console.log('receipt:', receipt);
}

async function checkAllowance(numTokens) {
  const allowance = await token.functions.allowance(selectedAccount, tokenCapacitor.address);
  return allowance.gte(numTokens);
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
