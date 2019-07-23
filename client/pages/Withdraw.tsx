import * as React from 'react';
import styled from 'styled-components';
import isEmpty from 'lodash/isEmpty';

import CenteredWrapper from '../components/CenteredWrapper';
import CenteredTitle from '../components/CenteredTitle';
import SectionLabel from '../components/SectionLabel';
import { Separator } from '../components/Separator';
import Actions from '../components/Actions';
import A from '../components/A';
import { EthereumContext, IEthereumContext } from '../components/EthereumProvider';
import { MainContext, IMainContext } from '../components/MainProvider';
import { StatelessPage } from '../interfaces';
import { sendAndWaitForTransaction } from '../utils/transaction';
import { tsToDeadline } from '../utils/datetime';
import PendingTransaction from '../components/PendingTransaction';

const CenteredSection = styled.div`
  padding: 2rem;
`;

const SectionDialog = styled.div`
  margin-bottom: 2rem;
  line-height: 1.5;
`;

interface IProps {
  query: any;
  asPath: string;
}

const Withdraw: StatelessPage<IProps> = ({ query, asPath }) => {
  const { onRefreshSlates }: IMainContext = React.useContext(MainContext);
  const {
    account,
    contracts: { gatekeeper, tokenCapacitor },
    votingRights,
    ethProvider,
    onRefreshBalances,
  }: IEthereumContext = React.useContext(EthereumContext);
  const [deadline, setDeadline] = React.useState(0);
  const [txPending, setTxPending] = React.useState(false);

  React.useEffect(() => {
    if (!isEmpty(gatekeeper) && asPath.includes('grant')) {
      gatekeeper.functions
        .requests(query.id)
        .then(p => p.approved && setDeadline(p.expirationTime.toNumber()));
    }
  }, [gatekeeper, query.id]);

  async function handleWithdraw(method: string, args: string) {
    try {
      if (account && !isEmpty(gatekeeper)) {
        const contract = method === 'withdrawTokens' ? tokenCapacitor : gatekeeper;
        setTxPending(true);
        await sendAndWaitForTransaction(ethProvider, contract, method, [args]);
        setTxPending(false);
        onRefreshBalances();
        onRefreshSlates();
      }
    } catch (error) {
      console.error(`ERROR failed to withdraw tokens: ${error.message}`);
      throw error;
    }
  }

  // TODO: include more slate context
  let dialog, method: string;
  let args: string;
  if (asPath.includes('voting')) {
    dialog = (
      <SectionDialog>
        The tokens you previously deposited for <strong>voting on the ballot</strong> can be
        withdrawn. Upon selecting Confirm and Withdraw, you'll be prompted to confirm in your
        MetaMask wallet.
      </SectionDialog>
    );
    method = 'withdrawVoteTokens';
    args = votingRights.toString();
  } else if (asPath.includes('stake')) {
    dialog = (
      <SectionDialog>
        The tokens you previously deposited for <strong>staking on the slate</strong> can be
        withdrawn. Upon selecting Confirm and Withdraw, you'll be prompted to confirm in your
        MetaMask wallet.
      </SectionDialog>
    );
    method = 'withdrawStake';
    args = query.id;
  } else if (asPath.includes('grant')) {
    dialog = (
      <SectionDialog>
        The tokens you were awarded for <strong>grant proposal</strong> can be withdrawn. Upon
        selecting Confirm and Withdraw, you'll be prompted to confirm in your MetaMask wallet.
        <strong>
          {deadline !== 0 && `You must withdraw these tokens by ${tsToDeadline(deadline)}`}
        </strong>
      </SectionDialog>
    );
    method = 'withdrawTokens';
    args = query.id;
  } else {
    console.log('Invalid asPath', asPath);
  }

  return (
    <>
      <CenteredTitle title="Withdraw Tokens" />
      <CenteredWrapper>
        <CenteredSection>
          <SectionLabel>HOW WITHDRAWING TOKENS WORKS</SectionLabel>
          {dialog}
          <SectionDialog>
            {'Contact us at '}
            <A color="blue" href="mailto:help@panvala.com">
              help@panvala.com
            </A>
            {' if you have any questions.'}
          </SectionDialog>
        </CenteredSection>

        <Separator />
        <Actions
          handleClick={() => method && handleWithdraw(method, args)}
          actionText={'Confirm and Withdraw'}
        />
      </CenteredWrapper>

      <PendingTransaction isOpen={txPending} setOpen={setTxPending} />
    </>
  );
};

Withdraw.getInitialProps = async ({ query, asPath }) => {
  return { query, asPath };
};

export default Withdraw;
