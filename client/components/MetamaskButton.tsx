import * as React from 'react';
import styled from 'styled-components';
import Image from './Image';
import Button from './Button';
import Flex from './system/Flex';

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 1.5rem;
`;

const MetamaskButton: React.SFC<any> = props => {
  return (
    <ButtonWrapper>
      <Button type="default" large onClick={props.handleClick}>
        <Flex mr={2} justifyCenter alignCenter>
          <Image src="/static/metamask-logo.svg" alt="metamask icon" />
        </Flex>
        {props.text}
      </Button>
    </ButtonWrapper>
  );
};

export default MetamaskButton;
