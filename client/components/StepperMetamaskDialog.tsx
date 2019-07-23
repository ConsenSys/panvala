import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';
import InlineImage from './InlineImage';

const Wrapper = styled.div`
  font-size: 0.9rem;
  color: ${COLORS.grey3};
  line-height: 1.5rem;
  margin: 1rem 0;
`;

const StepperMetamaskDialog: React.SFC = () => {
  return (
    <Wrapper>
      {'MetaMask will open a new window to confirm. If you don’t see it, please click the '}
      <InlineImage src={'/static/metamask-profile.png'} alt={'metamask icon'} />
      {' icon in the browser.'}
    </Wrapper>
  );
};

export default StepperMetamaskDialog;
