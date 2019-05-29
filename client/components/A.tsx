import styled from 'styled-components';
import { COLORS } from '../styles';

const A: any = styled.a`
  color: ${props => (props.blue ? COLORS.blue2 : 'inherit')};
`;

export default A;
