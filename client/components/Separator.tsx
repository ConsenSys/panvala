import styled from 'styled-components';
import { COLORS } from '../styles';

export const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
  /* border-width: ${({ borderWidth }) => (borderWidth ? `${borderWidth}px` : '1px')}; */
`;
