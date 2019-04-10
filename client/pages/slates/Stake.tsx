import React from 'react';
import styled from 'styled-components';
import Button from '../../components/Button';
import CenteredTitle from '../../components/CenteredTitle';
import CenteredWrapper from '../../components/CenteredWrapper';
import Image from '../../components/Image';
import Modal, { ModalTitle, ModalDescription } from '../../components/Modal';
import RouterLink from '../../components/RouterLink';
import SectionLabel from '../../components/SectionLabel';
import { Separator } from '../../components/Separator';
import { COLORS } from '../../styles';

const Wrapper = styled.div`
  font-family: 'Roboto';
  margin: 2rem 10rem;
`;

const CenteredSection = styled.div`
  padding: 2rem;
`;

const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 2rem;
  font-family: 'Roboto';
`;

const FlexWrapper = styled.div`
  display: flex;
`;

const ActionHelpMessage = styled.div`
  font-size: 0.75rem;
  width: 16rem;
  text-align: right;
  margin-right: 1rem;
  color: ${COLORS.grey3};
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

export const StakeActions = () => (
  <ActionsWrapper>
    <FlexWrapper>
      <Button large>Back</Button>
      <Button large type="default">
        Confirm and Deposit PAN
      </Button>
    </FlexWrapper>
    <ActionHelpMessage>
      This will redirect to a seperate MetaMask window to confirm your transaction.
    </ActionHelpMessage>
    {/* <RouterLink href="/ballots/vote" as="/ballots/vote">
          </RouterLink> */}
  </ActionsWrapper>
);

export const StakeContainer = () => (
  <Wrapper>
    {/* <CenteredTitle title="Stake Tokens on a  Slate" /> */}
    <CenteredWrapper>
      <CenteredSection>
        <SectionLabel>TOKEN DEPOSIT</SectionLabel>
        <SectionStatement>
          A deposit of <strong>{500} PAN</strong> tokens is required.
        </SectionStatement>
        <P>
          After a slate has tokens staked, the Panvala token holding community will have the ability
          to vote for or against the slate when the voting period begins. If the slate that you
          stake tokens on is successful, you will receive a supporter reward of 500 PAN. If the
          slate that you stake tokens on is unsuccessful, you will lose your token deposit.
        </P>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem' }}>
          <div>Total token deposit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>500 PAN</div>
        </div>
        <BlackSeparator />
      </CenteredSection>

      <Separator />
      <StakeActions />
    </CenteredWrapper>
  </Wrapper>
);

export default () => {
  // modal opener
  const [isOpen, setOpenModal] = React.useState(false);
  return (
    <>
      <Modal handleClick={() => setOpenModal(false)} isOpen={isOpen}>
        <Image src="/static/check.svg" alt="tokens staked" />
        <ModalTitle>{'Tokens staked.'}</ModalTitle>
        <ModalDescription className="flex flex-wrap">
          Now that you have staked tokens on this slate the Panvala token holding community will
          have the ability to vote for or against the slate when the voting period begins.
        </ModalDescription>
        <Button type="default" onClick={() => setOpenModal(false)}>
          {'Done'}
        </Button>
      </Modal>

      <StakeContainer />
    </>
  );
};
