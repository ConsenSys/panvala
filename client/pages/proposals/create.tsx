import * as React from 'react';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Image from '../../components/Image';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import ProposalForm from '../../components/ProposalForm';
import { postProposal } from '../../utils/api';
import { IProposal, IAppContext } from '../../interfaces';
import { AxiosResponse } from 'axios';
import { SingletonRouter, withRouter } from 'next/router';

type IProps = {
  router: SingletonRouter;
};

const CreateProposal: React.FunctionComponent<IProps> = ({ router }) => {
  const { onNotify, onRefreshProposals }: IAppContext = React.useContext(AppContext);

  const [isOpen, setOpenModal] = React.useState(false);

  async function handleSubmit(formValues: IProposal) {
    console.log('proposal-form-values:', formValues);

    try {
      const response: AxiosResponse = await postProposal(formValues);
      if (response.status === 200) {
        setOpenModal(true);
        await onRefreshProposals();
      }
    } catch (error) {
      onNotify(error.message, 'error');
    }
  }

  return (
    <div>
      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <Image src="/static/check.svg" alt="grant proposal created" />
        <ModalTitle>{'Grant proposal created.'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          You have successfully created a Panvala Grant Proposal. Now groups that are creating
          slates can attach your grant to their slate.
        </ModalDescription>
        <Button
          type="default"
          onClick={() => {
            setOpenModal(false);
            router.push('/proposals');
          }}
        >
          {'Done'}
        </Button>
      </Modal>

      <CenteredTitle title="Create a Grant Proposal" />
      <CenteredWrapper>
        <ProposalForm onHandleSubmit={handleSubmit} />
      </CenteredWrapper>
    </div>
  );
};

export default withRouter(CreateProposal);
