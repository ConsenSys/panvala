import styled from 'styled-components';
import { colors } from '../styles';
import { space } from 'styled-system';

export const Separator = styled.div<any>`
  border-top: 1px solid ${colors.greys.light};
  ${({ width }: any) => width && `border-top-width: ${width}px`};
  ${space};
`;
