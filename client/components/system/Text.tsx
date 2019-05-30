import styled from 'styled-components';
import { space, width, fontSize, color, textAlign, lineHeight, fontWeight } from 'styled-system';
import { COLORS } from '../../styles';

const Text: any = styled.p`
  font-family: 'Roboto';
  color: ${COLORS.grey2};
  ${space};
  ${width};
  ${color};
  ${fontSize};
  ${textAlign};
  ${lineHeight};
  ${fontWeight};
`;

Text.displayName = 'Text';

export default Text;
