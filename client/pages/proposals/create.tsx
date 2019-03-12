import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../styles';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import { FormWrapper } from '../../components/Form';
import Image from '../../components/Image';
import Modal from '../../components/Modal';
import ProposalForm from '../../components/ProposalForm';
import { postProposal } from '../../utils/api';
import { IProposal } from '../../interfaces';
import CenteredTitle from '../../components/CenteredTitle';

type Props = {
  account: string;
  provider: any;
};

const ModalTitle = styled.div`
  font-size: 1.5em;
  color: ${COLORS.grey2};
  margin: 1em 0;
`;

const ModalDescription = styled.div`
  font-size: 1em;
  color: ${COLORS.grey3};
  line-height: 1.5em;
  margin-bottom: 1em;
  text-align: center;
`;

const CreateProposal: React.FunctionComponent<Props> = () => {
  const { onNotify, onRefreshProposals }: any = React.useContext(AppContext);

  const [isOpen, setOpenModal] = React.useState(false);

  async function handleSubmit(formValues: IProposal) {
    console.log('proposal-form-values:', formValues);

    try {
      const response = await postProposal(formValues);
      if (response.status === 200) {
        setOpenModal(true);
        await onRefreshProposals();
        // TODO: redirect: /proposals
        // or: move this logic to proposals/index and remove from componentDidMount in Layout
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
        <Button type="default" onClick={() => setOpenModal(false)}>
          {'Done'}
        </Button>
      </Modal>

      <CenteredTitle title="Create a Grant Proposal" />
      <FormWrapper>
        <ProposalForm onHandleSubmit={handleSubmit} />
      </FormWrapper>
    </div>
  );
};

export default CreateProposal;
