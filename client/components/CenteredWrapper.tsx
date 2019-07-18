import styled from 'styled-components';
import { COLORS } from '../styles';
import { space, width } from 'styled-system';
import Flex from './system/Flex';

const CenteredWrapper: any = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2rem 5rem;
  border: 1px solid #f0f5f6;
  color: ${COLORS.text};
  font-family: 'Roboto';
  ${space};
  ${width};
`;

export default (props: any) => (
  <Flex justifyCenter>
    <CenteredWrapper
      mx={['1em', '3em', '3em', '4em']}
      width={['100%', '85%', '80%', '80%', '850px']}
      {...props}
    >
      {props.children}
    </CenteredWrapper>
  </Flex>
);
