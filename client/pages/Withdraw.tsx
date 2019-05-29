import * as React from 'react';
import styled from 'styled-components';

import CenteredWrapper from '../components/CenteredWrapper';
import CenteredTitle from '../components/CenteredTitle';
import SectionLabel from '../components/SectionLabel';
import { Separator } from '../components/Separator';
import Actions from '../components/Actions';
import A from '../components/A';
import { EthereumContext } from '../components/EthereumProvider';
import { MainContext } from '../components/MainProvider';
import { NotificationsContext } from '../components/NotificationsProvider';
import { StatelessPage, IMainContext, IEthereumContext } from '../interfaces';
import { sendAndWaitForTransaction } from '../utils/transaction';

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
  const { onRefreshSlates, slatesByID, proposalsByID }: IMainContext = React.useContext(
    MainContext
  );
  const {
    account,
    contracts,
    votingRights,
    ethProvider,
    onRefreshBalances,
  }: IEthereumContext = React.useContext(EthereumContext);
  const { onHandleGetUnreadNotifications } = React.useContext(NotificationsContext);

  async function handleWithdraw(method: string, args: string) {
    try {
      if (account && ethProvider && contracts && slatesByID && proposalsByID) {
        await sendAndWaitForTransaction(ethProvider, contracts.gatekeeper, method, [args]);
        onRefreshBalances();
        onRefreshSlates();
        onHandleGetUnreadNotifications(account, slatesByID, proposalsByID);
      }
    } catch (error) {
      console.error(`ERROR failed to withdraw tokens: ${error.message}`);
      throw error;
    }
  }

  let dialog, method: string;
  let args: string;
  if (asPath.includes('voting')) {
    dialog = (
      <SectionDialog>
        The tokens you previously deposited for <strong>voting on the ballot</strong> can be
        withdrawn. Upon selecting Confirm and Withdraw, you'll be prompted to confirm in you
        MetaMask wallet.
        <strong>You must withdraw these tokens by 00/00/0000.</strong>
      </SectionDialog>
    );
    method = 'withdrawVoteTokens';
    args = votingRights.toString();
  } else if (asPath.includes('stake')) {
    dialog = (
      <SectionDialog>
        The tokens you previously deposited for <strong>staking on the slate</strong> can be
        withdrawn. Upon selecting Confirm and Withdraw, you'll be prompted to confirm in you
        MetaMask wallet.
        <strong>You must withdraw these tokens by 00/00/0000.</strong>
      </SectionDialog>
    );
    method = 'withdrawStake';
    args = query.id;
  } else if (asPath.includes('grant')) {
    dialog = (
      <SectionDialog>
        The tokens you were awarded for <strong>grant proposal</strong> can be withdrawn. Upon
        selecting Confirm and Withdraw, you'll be prompted to confirm in you MetaMask wallet.
        <strong>You must withdraw these tokens by 00/00/0000.</strong>
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
            <A blue href="mailto:help@panvala.com">
              help@panvala.com
            </A>
            {' if you have any questions.'}
          </SectionDialog>
        </CenteredSection>

        <Separator />
        <Actions
          handleClick={() => method && handleWithdraw(method, args)}
          handleBack={null}
          actionText={'Confirm and Withdraw'}
        />
      </CenteredWrapper>
    </>
  );
};

Withdraw.getInitialProps = async ({ query, asPath }) => {
  return { query, asPath };
};

export default Withdraw;
