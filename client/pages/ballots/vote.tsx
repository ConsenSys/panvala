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
import { randomSalt, generateCommitHash } from '../../utils/voting';
import { baseToConvertedUnits } from '../../utils/format';

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
    contracts,
    account,
    panBalance,
    gkAllowance,
    votingRights,
  }: IEthereumContext = React.useContext(EthereumContext);

  // component state
  const [choices, setChoice]: [IChoices, any] = React.useState({
    firstChoice: '',
    secondChoice: '',
  });
  const [salt]: [string, any] = React.useState(randomSalt().toString());

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
   * Click handler for submitting/committing a vote
   */
  async function handleSubmitVote() {
    console.log('choices:', choices);

    // enforce both first and second choices
    if (choices.firstChoice === '' || typeof choices.firstChoice === 'undefined') {
      toast.error('Must select a first choice');
      return;
    }

    if (choices.secondChoice === '' || typeof choices.secondChoice === 'undefined') {
      toast.error('Must select a second choice');
      return;
    }

    if (account && contracts && contracts.token) {
      const ballot: ISubmitBallot = {
        choices: {
          // 0 = grant
          0: {
            firstChoice: utils.bigNumberify(choices.firstChoice),
            secondChoice: utils.bigNumberify(choices.secondChoice),
          },
        },
        salt,
        voterAddress: account,
      };
      console.log('ballot:', ballot);

      // ['grant', 'governance']
      const commitHash: string = generateCommitHash(ballot.choices, salt);
      console.log('commitHash:', commitHash);

      let numTokens: utils.BigNumber = utils.bigNumberify('0');

      // NOTE: this userflow might need revision
      // check if user has voteTokenBalance
      if (votingRights.gt('0') && panBalance.eq('0')) {
        console.log('only votingRights');
        // entire balance is being used as votingRights
        // -> vote w/ votingRights
        numTokens = votingRights;
      } else if (votingRights.gt('0') && panBalance.gt('0')) {
        console.log('both votingRights and user balance');
        // balance is split between gate_keeper and user_account
        if (gkAllowance.gt(panBalance)) {
          // allowance > balance
          // -> use all balance + votingRights
          numTokens = panBalance.add(votingRights);
        } else {
          // allowance <= balance
          // -> use allowance + votingRights
          numTokens = gkAllowance.add(votingRights);
        }
      } else if (gkAllowance.eq('0') && panBalance.gt('0')) {
        console.log('no allowance. only user balance');
        // allowance is 0
        // -> approve the gateKeeper contract first, then vote with entire balance
        await contracts.token.functions.approve(contracts.gateKeeper.address, panBalance);
        numTokens = panBalance;
      } else if (votingRights.eq('0') && panBalance.gt('0')) {
        console.log('no voting rights. only user balance');
        // entire balance is being kept by user
        // -> vote with entire balance
        numTokens = panBalance;
      }

      console.log('numTokens:', baseToConvertedUnits(numTokens, 18));

      if (numTokens.gt('0')) {
        // estimate how much it's gonna cost (gasLimit)
        const estimate = await contracts.gateKeeper.estimate.commitBallot(commitHash, numTokens);
        // commit (vote) the ballot to the gateKeeper contract
        // custom gasLimit can be provided here
        // -> gasPrice needs to be set also -- otherwise it will send with 1.0 gwei gas, which is not fast enough
        await contracts.gateKeeper.functions.commitBallot(commitHash, numTokens, {
          gasLimit: estimate.add('70000').toHexString(), // for safety, +70k gas (+20k doesn't cut it)
          gasPrice: utils.parseUnits('9.0', 'gwei'),
        });
      }
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
                    address={slate.ownerAddress}
                    onSetChoice={handleSetChoice}
                    proposals={slate.proposals}
                    slateID={slate.id.toString()}
                    asPath={'/ballots/vote'}
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
