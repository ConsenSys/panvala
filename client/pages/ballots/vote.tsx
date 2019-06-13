import * as React from 'react';
import styled from 'styled-components';
import { withRouter, SingletonRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utils, Signer } from 'ethers';

import { COLORS } from '../../styles';
import { MainContext } from '../../components/MainProvider';
import { EthereumContext } from '../../components/EthereumProvider';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Deadline from '../../components/Deadline';
import Image from '../../components/Image';
import Label from '../../components/Label';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import SectionLabel from '../../components/SectionLabel';
import { ISlate, IMainContext, IEthereumContext, ISubmitBallot, IChoices } from '../../interfaces';
import { randomSalt, generateCommitHash, generateCommitMessage } from '../../utils/voting';
import { baseToConvertedUnits } from '../../utils/format';
import { postBallot } from '../../utils/api';
import { convertEVMSlateStatus, SlateStatus } from '../../utils/status';
import Actions from '../../components/Actions';
import { loadState, LINKED_WALLETS } from '../../utils/localStorage';

type IProps = {
  account?: string;
  provider?: any;
  router: SingletonRouter;
};

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

const Vote: React.FunctionComponent<IProps> = ({ router }) => {
  // get contexts
  const { slates, currentBallot }: IMainContext = React.useContext(MainContext);
  const {
    contracts,
    account,
    panBalance,
    gkAllowance,
    votingRights,
    ethProvider,
  }: IEthereumContext = React.useContext(EthereumContext);

  // component state
  // choice selector
  const [choices, setChoice]: [IChoices, any] = React.useState({
    firstChoice: '',
    secondChoice: '',
  });
  // generate random salt on-load
  const [salt]: [string, any] = React.useState(randomSalt().toString());
  // modal opener
  const [isOpen, setOpenModal] = React.useState(false);

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
      // TODO: read this from the Gatekeeper
      const ballotID: string = '0';
      const ballot: ISubmitBallot = {
        epochNumber: utils.bigNumberify(ballotID).toString(),
        choices: {
          // 0 = grant
          0: {
            firstChoice: utils.bigNumberify(choices.firstChoice).toString(), // NOTE: api expects strings
            secondChoice: utils.bigNumberify(choices.secondChoice).toString(),
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
        // -> approve the gatekeeper contract first, then vote with entire balance
        await contracts.token.functions.approve(contracts.gatekeeper.address, panBalance);
        numTokens = panBalance;
      } else if (votingRights.eq('0') && panBalance.gt('0')) {
        console.log('no voting rights. only user balance');
        // entire balance is being kept by user
        // -> vote with entire balance
        numTokens = panBalance;
      }

      console.log('numTokens:', baseToConvertedUnits(numTokens, 18));

      if (ethProvider && numTokens.gt('0')) {
        // 'Commit hash, first choice, second choice, salt'
        const message = generateCommitMessage(commitHash, ballot.choices['0'], salt);
        // sign mesage with metamask signer
        const signer: Signer = ethProvider.getSigner();
        const signature = await signer.signMessage(message);
        console.log('signature:', signature);

        try {
          // save ballot to api/db
          const res = await postBallot(ballot, commitHash, signature);

          if (res.status === 200) {
            // estimate how much it's gonna cost (gasLimit)
            const estimate = await contracts.gatekeeper.estimate.commitBallot(
              commitHash,
              numTokens
            );
            // commit (vote) the ballot to the gatekeeper contract
            // custom gasLimit can be provided here
            // -> gasPrice needs to be set also -- otherwise it will send with 1.0 gwei gas, which is not fast enough
            const txOptions = {
              gasLimit: estimate.add('70000').toHexString(), // for safety, +70k gas (+20k doesn't cut it)
              gasPrice: utils.parseUnits('9.0', 'gwei'),
            };

            // When the delegation feature exists, include the voter in the call
            if (typeof contracts.gatekeeper.functions.delegateVotingRights !== 'undefined') {
              let voter = account;
              const linkedWallets = loadState(LINKED_WALLETS);
              if (!!linkedWallets && !!linkedWallets.coldWallet) {
                const delegate = await contracts.gatekeeper.functions.delegate(
                  linkedWallets.coldWallet
                );
                if (delegate === account) {
                  voter = linkedWallets.coldWallet;
                }
              }
              await contracts.gatekeeper.functions.commitBallot(
                voter,
                commitHash,
                numTokens,
                txOptions
              );
            } else {
              await contracts.gatekeeper.functions.commitBallot(commitHash, numTokens, txOptions);
            }

            setOpenModal(true);
            toast.success('Successfully submitted a ballot');
          }
        } catch (error) {
          let toastMessage = error.toastMessage;
          if (votingRights.gt('0') && panBalance.eq('0')) {
            toastMessage =
              'Entire balance is being used as votingRights, and they may currently be locked in a vote.';
          }
          toast.error(toastMessage);
        }
      }
    }
  }

  return (
    <div>
      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <Image src="/static/check.svg" alt="vote submitted" />
        <ModalTitle>{'Vote submitted.'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          Your vote has been recorded. It won't be revealed publicly until the vote concludes.
        </ModalDescription>
        <Button
          type="default"
          onClick={() => {
            setOpenModal(false);
            router.push('/ballots');
          }}
        >
          {'Done'}
        </Button>
      </Modal>

      <div className="flex justify-end">
        <Deadline ballot={currentBallot} route="ballots" />
      </div>
      <CenteredTitle title="Submit Vote" />
      <CenteredWrapper>
        <div className="pa4">
          <SectionLabel>{'GRANTS'}</SectionLabel>
          <Label required>{'Select your first and second choice slate'}</Label>
          <div className="flex flex-wrap mt3">
            {slates && slates.length > 0
              ? slates
                  .filter(s => s.status === SlateStatus.Staked)
                  .map((slate: ISlate) => (
                    <Card
                      key={slate.id}
                      title={slate.title}
                      subtitle={slate.proposals.length + ' Grants Included'}
                      description={slate.description}
                      category={slate.category}
                      status={convertEVMSlateStatus(slate.status)}
                      choices={choices}
                      address={slate.recommenderAddress}
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
        <Actions
          handleClick={handleSubmitVote}
          handleBack={null}
          actionText={'Confirm and Submit'}
        />
      </CenteredWrapper>
    </div>
  );
};

export default withRouter(Vote);
