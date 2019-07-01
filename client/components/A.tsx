import styled from 'styled-components';
import { color } from 'styled-system';

const A: any = styled.a`
  color: inherit;
  cursor: pointer;
  ${({ bold }: any) => bold && 'font-weight: bold'};
  &:active,
  &:focus {
    outline: 0;
    border: 0;
  }
  ${color};
`;

export default A;
