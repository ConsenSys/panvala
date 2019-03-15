import * as React from 'react';
import styled from 'styled-components';
import { withRouter, SingletonRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utils } from 'ethers';

import { COLORS } from '../../styles';
import { AppContext } from '../../components/Layout';
import { EthereumContext } from '../../components/EthereumProvider';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CenteredTitle from '../../components/CenteredTitle';
import Deadline from '../../components/Deadline';
import Label from '../../components/Label';
import SectionLabel from '../../components/SectionLabel';
import { ISlate, IAppContext, IEthereumContext, ISubmitBallot, IChoices } from '../../interfaces';
import { randomSalt, getCommitHashes } from '../../utils/values';

type IProps = {
  account?: string;
  provider?: any;
  router: SingletonRouter;
};

const BallotWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2em;
  border: 1px solid #f0f5f6;
  color: ${COLORS.text};
`;

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const Vote: React.FunctionComponent<IProps> = ({ router }) => {
  // get contexts
  const { slates, currentBallot }: IAppContext = React.useContext(AppContext);
  const {
    ethProvider,
    contracts,
    account,
    panBalance,
    gkAllowance,
  }: IEthereumContext = React.useContext(EthereumContext);

  // component state
  const [choices, setChoice]: [IChoices, any] = React.useState({
    firstChoice: '',
    secondChoice: '',
  });
  const [salt]: [string, any] = React.useState(randomSalt());

  /**
   * Click handler for choosing which rank (first/second) a slate has
   * @param rank key to specify which choice to set
   * @param slateID id of slate choice
   */
  function handleSetChoice(rank: string, slateID: string) {
    if (
      (rank === 'firstChoice' && choices.secondChoice === slateID) ||
      (rank === 'secondChoice' && choices.firstChoice === slateID)
    ) {
      // user chose a different rank for a slate
      setChoice({ [rank]: slateID });
    } else {
      // user chose a unique rank for a slate
      setChoice({
        ...choices,
        [rank]: slateID,
      });
    }
  }

  /**
   * Click/Route handler for redirecting to the detailed view of a slate
   * @param slateID id of slate
   */
  function handleViewSlateDetails(slateID: string) {
    // this is necessary (instead of just using RouterLink)
    // because click handler is on 'View slate details', not the actual card
    router.push(`/DetailedView?id=${slateID}`, `/slates/${slateID}`);
  }

  /**
   * Click handler for submitting/committing a vote
   */
  async function handleSubmitVote() {
    console.log('choices:', choices);

    if (!choices.firstChoice) {
      toast.error('Must select a first choice');
      return;
    }

    if (account && contracts) {
      const ballot: ISubmitBallot = {
        choices: {
          grant: {
            firstChoice: choices.firstChoice,
            secondChoice: choices.secondChoice || choices.firstChoice,
          },
        },
        salt,
        voterAddress: account,
      };
      console.log('ballot:', ballot);

      // ['grant', 'governance']
      const ballotChoicesKeys = Object.keys(ballot.choices);
      const commitHashes: string[] = getCommitHashes(ballot, ballotChoicesKeys);
      console.log('commitHashes:', commitHashes);

      // // check if user has voteTokenBalance
      // let votingRights: utils.BigNumber = await contracts.gateKeeper.functions.voteTokenBalance(
      //   account
      // );

      // let numTokens: utils.BigNumber = utils.bigNumberify('0');
      // if (votingRights.gt('0') && panBalance.eq('0')) {
      //   // entire balance is being used as votingRights
      //   // -> vote w/ votingRights
      //   numTokens = votingRights;
      // } else if (votingRights.gt('0') && panBalance.gt('0')) {
      //   // balance is split between gate_keeper and user_account
      //   // -> deposit more tokens / get more votingRights
      //   await contracts.gateKeeper.functions.depositVoteTokens(panBalance);
      //   votingRights = await contracts.gateKeeper.functions.voteTokenBalance(account);
      //   numTokens = votingRights;
      // } else if (
      //   (votingRights.eq('0') && panBalance.gt('0')) ||
      //   (gkAllowance.eq('0') && panBalance.gt('0'))
      // ) {
      //   // entire balance is being kept by user -or- alowance is 0
      //   // -> approve the gateKeeper contract
      //   await contracts.token.functions.approve(contracts.gateKeeper.address, panBalance);
      // }

      // console.log('numTokens:', numTokens);

      // if (numTokens.gt('0')) {
      //   // commit the ballot to the gateKeeper contract
      //   await contracts.gateKeeper.functions.commitBallot(commitHash, numTokens);
      // }
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Deadline ballot={currentBallot} route="ballots" />
      </div>
      <CenteredTitle title="Submit Vote" />
      <BallotWrapper>
        <div className="pa4">
          <SectionLabel>{'GRANTS'}</SectionLabel>
          <Label required>{'Select your first and second choice slate'}</Label>
          <div className="flex flex-wrap mt3">
            {slates && slates.length > 0
              ? slates.map((slate: ISlate) => (
                  <Card
                    key={slate.id}
                    title={slate.title}
                    subtitle={slate.proposals.length + ' Grants Included'}
                    description={slate.description}
                    category={slate.category}
                    status={slate.status}
                    choices={choices}
                    onSetChoice={handleSetChoice}
                    slateID={slate.id}
                    onHandleViewSlateDetails={() => handleViewSlateDetails(slate.id)}
                  />
                ))
              : null}
          </div>
        </div>

        <Separator />

        <div className="flex flex-column pv4 ph4 items-end">
          <div className="flex">
            <Button large>{'Back'}</Button>
            <Button type="submit" large onClick={handleSubmitVote}>
              {'Confirm and Submit'}
            </Button>
          </div>
          <div className="f7 w5 tr mr3">
            {'This will redirect to a seperate MetaMask window to confirm your transaction.'}
          </div>
        </div>
      </BallotWrapper>
    </div>
  );
};

export default withRouter(Vote);
