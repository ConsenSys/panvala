import * as React from 'react';
import styled from 'styled-components';
import { withRouter, SingletonRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utils, Signer } from 'ethers';
import isEmpty from 'lodash/isEmpty';

import { COLORS } from '../../styles';
import { MainContext, IMainContext } from '../../components/MainProvider';
import { EthereumContext, IEthereumContext } from '../../components/EthereumProvider';
import Button from '../../components/Button';
import Card from '../../components/Card';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Deadline from '../../components/Deadline';
import Image from '../../components/Image';
import Label from '../../components/Label';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import SectionLabel from '../../components/SectionLabel';
import { ISlate, ISubmitBallot, IChoices } from '../../interfaces';
import {
  randomSalt,
  generateCommitHash,
  generateCommitMessage,
  getMaxVotingRights,
} from '../../utils/voting';
import { postBallot } from '../../utils/api';
import { convertEVMSlateStatus, SlateStatus } from '../../utils/status';
import Actions from '../../components/Actions';
import { loadState, LINKED_WALLETS } from '../../utils/localStorage';
import { SLATE } from '../../utils/constants';

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
    contracts: { token, gatekeeper, tokenCapacitor, parameterStore },
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
    // await gatekeeper.functions.depositVoteTokens(panBalance);
    // return;
    // enforce both first and second choices
    if (choices.firstChoice === '' || typeof choices.firstChoice === 'undefined') {
      toast.error('Must select a first choice');
      return;
    }

    if (choices.secondChoice === '' || typeof choices.secondChoice === 'undefined') {
      toast.error('Must select a second choice');
      return;
    }

    if (account && !isEmpty(token)) {
      let numTokens = await getMaxVotingRights(
        panBalance,
        votingRights,
        gkAllowance,
        token,
        gatekeeper
      );

      let tokenHolder = account;
      const linkedWallets = loadState(LINKED_WALLETS);
      if (!!linkedWallets && !!linkedWallets.coldWallet) {
        const delegate = await gatekeeper.functions.delegate(linkedWallets.coldWallet);
        if (delegate === account) {
          tokenHolder = linkedWallets.coldWallet;
          // prettier-ignore
          numTokens = await gatekeeper.functions.voteTokenBalance(tokenHolder);
        }
      }
      console.log('numTokens:', numTokens);

      const ballot: ISubmitBallot = {
        epochNumber: currentBallot.epochNumber.toString(),
        choices: {
          [tokenCapacitor.address]: {
            firstChoice: utils.bigNumberify(choices.firstChoice).toString(),
            secondChoice: utils.bigNumberify(choices.secondChoice).toString(),
          },
        },
        salt,
        voterAddress: tokenHolder,
        ...(tokenHolder !== account && { delegate: account }),
      };
      console.log('ballot:', ballot);

      if (!isEmpty(ethProvider) && numTokens.gt('0')) {
        const commitHash: string = generateCommitHash(ballot.choices, salt);

        // 'Commit hash, first choice, second choice, salt'
        const message = generateCommitMessage(
          commitHash,
          ballot.choices[tokenCapacitor.address],
          salt
        );
        // sign mesage with metamask signer
        const signer: Signer = ethProvider.getSigner();
        const signature = await signer.signMessage(message);

        try {
          // save ballot to api/db
          const res = await postBallot(ballot, commitHash, signature);

          if (res.status === 200) {
            // estimate how much it's gonna cost (gasLimit)
            const estimate = await gatekeeper.estimate.commitBallot(
              tokenHolder,
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
            await gatekeeper.functions.commitBallot(tokenHolder, commitHash, numTokens, txOptions);

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
          console.error(toastMessage);
          throw error;
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
                      address={slate.recommender}
                      onSetChoice={handleSetChoice}
                      proposals={slate.proposals}
                      slateID={slate.id.toString()}
                      asPath={'/ballots/vote'}
                      type={SLATE}
                      incumbent={slate.incumbent}
                      recommender={slate.organization}
                      verifiedRecommender={slate.verifiedRecommender}
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
