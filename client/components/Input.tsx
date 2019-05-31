import styled from 'styled-components';
import { COLORS } from '../styles';
import { space, fontFamily } from 'styled-system';

const Input: any = styled.input`
  border: 1px solid ${COLORS.greyBorder};
  border-radius: 2px;
  width: 100%;
  padding: 0.8em;
  font-size: 0.8em;
  margin: 1em 0;

  color: ${COLORS.grey2};
  background-color: ${COLORS.grey6};

  ${space};
  ${fontFamily}
`;

export default Input;
