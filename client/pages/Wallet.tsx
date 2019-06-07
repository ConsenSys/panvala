import * as React from 'react';
import styled from 'styled-components';
import isEmpty from 'lodash/isEmpty';
import { toast } from 'react-toastify';
import { utils } from 'ethers';

import A from '../components/A';
import Tag from '../components/Tag';
import Label from '../components/Label';
import Input from '../components/Input';
import Button from '../components/Button';
import Box from '../components/system/Box';
import Text from '../components/system/Text';
import Flex from '../components/system/Flex';
import Identicon from '../components/Identicon';
import RouterLink from '../components/RouterLink';
import StepperMetamaskDialog from '../components/StepperMetamaskDialog';
import { IEthereumContext, EthereumContext } from '../components/EthereumProvider';
import { saveState, loadState, LINKED_WALLETS, ENABLED_ACCOUNTS } from '../utils/localStorage';
import { splitAddressHumanReadable, isAddress } from '../utils/format';
import { COLORS } from '../styles';

const CancelButton = styled(Button)`
  color: ${COLORS.grey3};
  font-weight: bold;
  position: absolute;
  top: 0;
  right: 1rem;
`;

const Wallet: React.SFC = () => {
  const {
    account,
    contracts: { gatekeeper },
    onRefreshBalances,
  }: IEthereumContext = React.useContext(EthereumContext);

  // list of enabled accounts. use to populate wallet list
  const enabledAccounts = loadState(ENABLED_ACCOUNTS);
  // delegate (metamask) hot wallet
  const [hotWallet, setHotWallet] = React.useState('');
  // voter (trezor/ledger) cold wallet
  const [coldWallet, setColdWallet] = React.useState('');

  const [step, setStep] = React.useState(0);
  const [confirmed, setConfirmed] = React.useState({
    coldWallet: false,
    hotWallet: false,
  });

  function setLinkedWallet(type: string, value: string) {
    setConfirmed({
      ...confirmed,
      [type]: false,
    });
    if (type === 'hotWallet') {
      setHotWallet(value);
    } else if (type === 'coldWallet') {
      setColdWallet(value);
    }
  }
  function confirmColdWallet() {
    const linkedWallets = loadState(LINKED_WALLETS);
    saveState(LINKED_WALLETS, {
      ...linkedWallets,
      coldWallet,
    });
    setConfirmed({
      ...confirmed,
      coldWallet: true,
    });
  }
  function confirmHotWallet() {
    const linkedWallets = loadState(LINKED_WALLETS);
    saveState(LINKED_WALLETS, {
      ...linkedWallets,
      hotWallet,
    });
    setConfirmed({
      ...confirmed,
      hotWallet: true,
    });
  }

  React.useEffect(() => {
    // get persisted state from local storage
    const linkedWallets = loadState(LINKED_WALLETS);

    if (account) {
      if (!linkedWallets) {
        // no link, fill in hot
        setHotWallet(account);
      } else {
        if (linkedWallets.hotWallet === account) {
          // signed in as hot
          setHotWallet(account);
        } else if (linkedWallets.hotWallet) {
          // signed in, but not as hot
          setHotWallet(linkedWallets.hotWallet);

          if (confirmed.hotWallet) {
            // confirmed hot, time to set cold
            if (linkedWallets.coldWallet) {
              // cold exists
              setColdWallet(linkedWallets.coldWallet);
            } else {
              // no cold set, fill in cold
              setColdWallet(account);
            }
          }
        }
      }
    }
  }, [account, confirmed.hotWallet]);

  async function linkDelegateVoter() {
    const linkedWallets = loadState(LINKED_WALLETS);
    if (
      !linkedWallets ||
      linkedWallets.hotWallet !== hotWallet ||
      linkedWallets.coldWallet !== coldWallet
    ) {
      console.error('Linked wallets not in sync with local storage');
      return;
    }
    // TODO: (might not be possible) check if hotWallet is an unlocked account in metamask
    setStep(1);

    if (!isEmpty(gatekeeper)) {
      try {
        // TODO:
        // const response = await gatekeeper.functions.delegateVoter(hotWallet);
        // setTxPending(true);

        // await response.wait();
        // setTxPending(false);
        // setStep(2);
        // toast.success('delegate voter tx mined');

        // save to local storage
        saveState(LINKED_WALLETS, {
          hotWallet,
          coldWallet,
        });

        onRefreshBalances();
      } catch (error) {
        if (!error.message.includes('User denied message signature.')) {
          throw error;
        }
      }
    }
  }

  const steps = [
    <>
      <Text textAlign="center" fontSize={'1.5rem'} m={0}>
        Link hot and cold wallets
      </Text>
      <RouterLink href="/slates" as="/slates">
        <CancelButton>Cancel</CancelButton>
      </RouterLink>

      {/* prettier-ignore */}
      <Text lineHeight={1.5}>
        Please sign in with and confirm your <A bold color="blue">hot wallet</A>.
        Your hot wallet will be your delegated voting wallet.
        Then sign in with the <A bold color="blue">cold wallet</A> (Ledger or Trezor)
        you would like to link the hot wallet with.
      </Text>

      <Label htmlFor="hot-wallet">{'Select hot wallet'}</Label>
      <Flex justifyStart noWrap alignCenter>
        <Identicon address={hotWallet} diameter={20} />
        <Input
          m={2}
          fontFamily="Fira Code"
          name="hot-wallet"
          onChange={(e: any) => setLinkedWallet('hotWallet', e.target.value)}
          value={hotWallet}
        />
        <Button
          width="100px"
          type="default"
          onClick={confirmHotWallet}
          bg={confirmed.hotWallet ? 'greens.light' : ''}
          disabled={!isAddress(hotWallet)}
        >
          {confirmed.hotWallet ? 'Confirmed' : 'Confirm'}
        </Button>
      </Flex>
      <Text mt={0} mb={4} fontSize={0} color="grey">
        Reminder: This is the address that will be able to vote with your PAN.
      </Text>

      <Label htmlFor="cold-wallet">{'Select cold wallet'}</Label>
      <Flex justifyStart noWrap alignCenter>
        <Identicon address={coldWallet} diameter={20} />
        <Input
          m={2}
          fontFamily="Fira Code"
          name="cold-wallet"
          onChange={(e: any) => setLinkedWallet('coldWallet', e.target.value)}
          value={coldWallet}
          disabled={!confirmed.hotWallet}
        />
        <Button
          width="100px"
          type="default"
          onClick={confirmColdWallet}
          bg={confirmed.coldWallet ? 'greens.light' : ''}
          disabled={!isAddress(coldWallet) || !confirmed.hotWallet}
        >
          {confirmed.coldWallet ? 'Confirmed' : 'Confirm'}
        </Button>
      </Flex>
      {/* prettier-ignore */}
      <Text mt={0} mb={4} fontSize={0} color="grey">
        This wallet must be connected.
        How to connect <A bold color="blue">Trezor</A> and <A bold color="blue">Ledger</A>.
      </Text>

      <Flex justifyEnd>
        <Button
          width="200px"
          large
          type="default"
          onClick={linkDelegateVoter}
          disabled={!confirmed.coldWallet || !confirmed.hotWallet}
        >
          Continue
        </Button>
      </Flex>
    </>,
    <div>
      <Text textAlign="center" fontSize={'1.5rem'} m={0}>
        Grant Permissions
      </Text>
      <CancelButton onClick={() => setStep(0)}>Cancel</CancelButton>

      <Text lineHeight={1.5}>
        By granting permissions in this transaction, you are allowing the contract to lock your PAN.
        You are not relinquishing control of your PAN and can withdraw it at anytime. Linking your
        hot and cold wallet will enable you to vote while your PAN is still stored in your cold
        wallet.
      </Text>

      <StepperMetamaskDialog />
    </div>,
    <>
      <Text textAlign="center" fontSize={'1.5rem'} mt={2} mb={4}>
        Wallets linked!
      </Text>

      <Text lineHeight={1.5} px={3}>
        You have now linked your cold and hot wallets. You can change these settings any time on the
        ballot screen or when you go to vote.
      </Text>

      <Box p={3}>
        <Text fontWeight="bold" fontSize={0}>
          Linked Cold Wallet
        </Text>
        <Flex justifyBetween alignCenter>
          <Identicon address={coldWallet} diameter={20} />
          <Box fontSize={1} fontFamily="fira code" px={2}>
            {splitAddressHumanReadable(coldWallet).slice(0, 30)} ...
          </Box>
          <Tag color="blue" bg="blues.light">
            COLD WALLET
          </Tag>
        </Flex>
      </Box>

      <Box p={3}>
        <Text fontWeight="bold" fontSize={0}>
          Active Hot Wallet
        </Text>
        <Flex justifyBetween alignCenter>
          <Identicon address={hotWallet} diameter={20} />
          <Box fontSize={1} fontFamily="fira code" px={2}>
            {splitAddressHumanReadable(hotWallet).slice(0, 30)} ...
          </Box>
          <Tag color="red" bg="reds.light">
            HOT WALLET
          </Tag>
        </Flex>
      </Box>

      <Flex justifyEnd>
        <Button
          width="150px"
          large
          type="default"
          onClick={null}
          disabled={
            (hotWallet &&
              coldWallet &&
              utils.getAddress(hotWallet) === utils.getAddress(coldWallet)) ||
            false
          }
        >
          Continue
        </Button>
      </Flex>
    </>,
  ];

  return (
    <Flex justifyCenter>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width={550}
        p={4}
        mt={[2, 3, 5, 6]}
        borderRadius={10}
        boxShadow={0}
      >
        <Box position="relative">{steps[step]}</Box>
      </Box>
    </Flex>
  );
};

export default Wallet;
