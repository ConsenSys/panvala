import styled from 'styled-components';
import { space, width, typography, color } from 'styled-system';
import { COLORS } from '../../styles';

const Text: any = styled.p`
  font-family: 'Roboto';
  color: ${COLORS.grey2};
  ${space};
  ${width};
  ${color};
  ${typography};
`;

Text.displayName = 'Text';

export default Text;
