import * as React from 'react';
import styled from 'styled-components';
import Button from './Button';
import { COLORS } from '../styles';

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

const Actions = ({ handleClick, actionText, handleBack }: any) => (
  <ActionsWrapper>
    <FlexWrapper>
      <Button large onClick={handleBack}>
        Back
      </Button>
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
