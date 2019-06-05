import * as React from 'react';
import styled from 'styled-components';
import Image from './Image';
import Button from './Button';

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 1.5rem;
`;
const StyledMMButton = styled(Button)`
  margin-left: 0;
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`;

const SignMessageButton = styled(Button)`
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
`;

const MetamaskButton: React.SFC<any> = props => {
  return (
    <ButtonWrapper>
      <StyledMMButton large>
        <Image src="/static/metamask-logo.svg" alt="metamask icon" wide />
      </StyledMMButton>
      <SignMessageButton type="default" large onClick={props.handleClick}>
        {props.text}
      </SignMessageButton>
    </ButtonWrapper>
  );
};

export default MetamaskButton;
