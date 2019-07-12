import * as React from 'react';
import styled from 'styled-components';
import Button from './Button';
import { COLORS } from '../styles';
import BackButton from './BackButton';

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

const Actions = ({ handleClick, actionText }: any) => (
  <ActionsWrapper>
    <FlexWrapper>
      <BackButton />
      <Button large type="default" onClick={handleClick}>
        {actionText}
      </Button>
    </FlexWrapper>
    <ActionHelpMessage>
      This will redirect to a separate MetaMask window to confirm your transaction.
    </ActionHelpMessage>
  </ActionsWrapper>
);

export default Actions;
