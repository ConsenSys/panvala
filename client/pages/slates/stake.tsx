import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { utils, ethers } from 'ethers';
import { TransactionResponse } from 'ethers/providers';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

import Actions from '../../components/Actions';
import Button from '../../components/Button';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import { EthereumContext, IEthereumContext } from '../../components/EthereumProvider';
import Image from '../../components/Image';
import { MainContext } from '../../components/MainProvider';
import MetamaskButton from '../../components/MetamaskButton';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import SectionLabel from '../../components/SectionLabel';
import { Separator } from '../../components/Separator';
import { StatelessPage } from '../../interfaces';
import Stepper, { StepperDialog } from '../../components/Stepper';
import StepperMetamaskDialog from '../../components/StepperMetamaskDialog';
import { COLORS } from '../../styles';
import { formatPanvalaUnits } from '../../utils/format';
import { sendApproveTransaction, sendStakeTokensTransaction } from '../../utils/transaction';
import RouterLink from '../../components/RouterLink';

const Wrapper = styled.div`
  font-family: 'Roboto';
`;

const CenteredSection = styled.div`
  padding: 2rem;
`;

const SectionStatement = styled.div`
  font-size: 1.3rem;
`;

const P = styled.p`
  font-size: 1.2rem;
  line-height: 1.75;
`;

const BlackSeparator = styled.div`
  margin-bottom: 1rem;
  border-bottom: 3px solid #606060;
`;

const Stake: StatelessPage<any> = ({ query, classes }) => {
  const { account, contracts, onRefreshBalances, gkAllowance }: IEthereumContext = React.useContext(
    EthereumContext
  );
  const { onRefreshSlates, slatesByID, onRefreshCurrentBallot } = React.useContext(MainContext);

  // stepper/modal opener
  const [stepperIsOpen, toggleOpenStepper] = React.useState(false);
  const [modalIsOpen, setOpenModal] = React.useState(false);
  // pending tx loader
  const [txPending, setTxPending] = React.useState(false);
  // slate user is staking on
  const [slate, setSlate] = React.useState({ requiredStake: '0' });

  // check if the user has approved the gatekeeper for the slate staking requirement
  const initialApproved: boolean =
    slate.requiredStake.toString() !== '0' && gkAllowance.gte(slate.requiredStake);
  const [approved, setApproved] = React.useState(initialApproved);

  // set slate and approved once slatesByID exists or when requiredStake changes
  React.useEffect(() => {
    if (slatesByID[query.id]) {
      setSlate(slatesByID[query.id]);
    }
    // prettier-ignore
    if (slate.requiredStake.toString() !== '0' && gkAllowance.gte(slate.requiredStake) && !approved) {
      setApproved(true);
    }
  }, [slatesByID, slate.requiredStake]);

  // step 1: approve
  async function handleApproveTokens() {
    if (!account || approved) {
      console.log('no account or already approved');
      return false;
    }

    if (contracts) {
      // send tx (pending)
      const response: TransactionResponse = await sendApproveTransaction(
        contracts.token,
        contracts.gatekeeper.address,
        ethers.constants.MaxUint256
      );
      setTxPending(true);

      // wait for tx to get mined
      await response.wait();
      setTxPending(false);

      // set approved
      toast.success('approve tx mined');
      setApproved(true);
      onRefreshBalances();
    }
  }

  // step 2: stakeTokens
  async function handleStakeTokens() {
    // check (again) if the user has approved the gatekeeper for the slate staking requirement
    const isApproved: boolean = gkAllowance.gte(slate.requiredStake);
    if (!account || !isApproved) {
      console.log('no account or not approved');
      return false;
    }

    if (contracts && contracts.hasOwnProperty('gatekeeper')) {
      const slateID = parseInt(query.id);
      // send tx (pending)
      const response = await sendStakeTokensTransaction(contracts.gatekeeper, slateID);
      setTxPending(true);

      // wait for tx to get mined
      await response.wait();
      setTxPending(false);

      // tx mined
      toast.success(`stakeTokens tx mined.`);
      // refresh balances, refresh slates
      onRefreshBalances();
      onRefreshSlates();
      onRefreshCurrentBallot();
      // TODO: refresh slate submission deadline on ballot
      toggleOpenStepper(false);
      setOpenModal(true);
    }
  }

  const requiredPAN = formatPanvalaUnits(utils.bigNumberify(slate.requiredStake));

  let steps = [
    <div>
      <StepperDialog>
        {`By confirming this transaction, you approve to spend ${requiredPAN} tokens to stake for this slate.`}
      </StepperDialog>
      <StepperMetamaskDialog />
      <MetamaskButton handleClick={handleApproveTokens} text="Initiate transaction with Metamask" />
    </div>,
    <div>
      <StepperDialog>
        {`By confirming this transaction, you are spending ${requiredPAN} tokens to stake for this slate.`}
      </StepperDialog>
      <StepperMetamaskDialog />
      <MetamaskButton handleClick={handleStakeTokens} text={`Stake ${requiredPAN}`} />
    </div>,
  ];

  // if approved, stake. otherwise, approve + stake
  const currentStep = approved ? 1 : 0;

  return (
    <>
      <Stepper
        isOpen={stepperIsOpen && !txPending}
        currentStep={currentStep}
        steps={steps}
        handleCancel={() => toggleOpenStepper(false)}
      />

      <Modal handleClick={() => setOpenModal(false)} isOpen={txPending || modalIsOpen}>
        {txPending ? (
          <>
            <Image src="/static/metamask-fox.svg" alt="metamask logo" width="80px" />
            <ModalTitle>{'Transaction Processing'}</ModalTitle>
            <ModalDescription className="flex flex-wrap">
              Please wait a few moments while MetaMask processes your transaction. This will only
              take a few moments.
            </ModalDescription>
            <CircularProgress className={classes.progress} />
          </>
        ) : (
          <>
            <Image src="/static/check.svg" alt="tokens staked" width="80px" />
            <ModalTitle>{'Tokens staked.'}</ModalTitle>
            <ModalDescription className="flex flex-wrap">
              Now that you have staked tokens on this slate the Panvala token holding community will
              have the ability to vote for or against the slate when the voting period begins.
            </ModalDescription>
            <RouterLink href="/slates" as="/slates">
              <Button type="default">{'Done'}</Button>
            </RouterLink>
          </>
        )}
      </Modal>

      <Wrapper>
        <CenteredTitle title="Stake Tokens on a Slate" />
        <CenteredWrapper>
          <CenteredSection>
            <SectionLabel>TOKEN DEPOSIT</SectionLabel>
            <SectionStatement>
              A deposit of <strong>{`${requiredPAN}`}</strong> tokens is required.
            </SectionStatement>
            <P>
              After a slate has tokens staked, the Panvala token holding community will have the
              ability to vote for or against the slate when the voting period begins. If the slate
              that you stake tokens on is unsuccessful, you will lose your token deposit.
            </P>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem' }}>
              <div>Total token deposit</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{`${requiredPAN}`}</div>
            </div>
            <BlackSeparator />
          </CenteredSection>

          <Separator />
          <Actions
            handleClick={() => toggleOpenStepper(true)}
            actionText={'Confirm and Deposit PAN'}
          />
        </CenteredWrapper>
      </Wrapper>
    </>
  );
};

Stake.getInitialProps = async ({ query }) => {
  return { query };
};

const styles = (theme: any) => ({
  progress: {
    margin: theme.spacing.unit * 2,
    color: COLORS.primary,
  },
});
export default withStyles(styles)(Stake);
