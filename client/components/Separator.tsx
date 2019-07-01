import styled from 'styled-components';
import { colors } from '../styles';

export const Separator = styled.div<{ width?: string }>`
  border-top: 1px solid ${colors.greys.light};
  ${({ width }: any) => width && `border-top-width: ${width}px`};
`;
