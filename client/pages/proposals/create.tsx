import * as React from 'react';
import { AxiosResponse } from 'axios';
import { SingletonRouter, withRouter } from 'next/router';
import { toast } from 'react-toastify';

import Button from '../../components/Button';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Image from '../../components/Image';
import { MainContext, IMainContext } from '../../components/MainProvider';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import ProposalForm from '../../components/ProposalForm';
import { postProposal } from '../../utils/api';
import { IProposal } from '../../interfaces';
import RouterLink from '../../components/RouterLink';

type IProps = {
  router: SingletonRouter;
};

const CreateProposal: React.FunctionComponent<IProps> = ({ router }) => {
  const { onRefreshProposals }: IMainContext = React.useContext(MainContext);

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
      toast.error(error.message);
    }
  }

  return (
    <div>
      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <Image src="/static/check.svg" alt="grant proposal created" width="80px" />
        <ModalTitle>{'Grant proposal created.'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          You have successfully created a Panvala Grant Proposal. Now groups that are creating
          slates can attach your grant to their slate.
        </ModalDescription>
        <RouterLink href="/proposals" as="/proposals">
          <Button type="default">{'Done'}</Button>
        </RouterLink>
      </Modal>

      <CenteredTitle title="Create a Grant Proposal" />
      <CenteredWrapper>
        <ProposalForm onHandleSubmit={handleSubmit} />
      </CenteredWrapper>
    </div>
  );
};

export default withRouter(CreateProposal);
