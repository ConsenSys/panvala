import styled from 'styled-components';
import { COLORS } from '../styles';

const CenteredWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2rem 10rem;
  border: 1px solid #f0f5f6;
  color: ${COLORS.text};
`;

export default CenteredWrapper;
