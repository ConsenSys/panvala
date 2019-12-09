import styled from 'styled-components';
import {
  space,
  color,
  layout,
  typography,
  flexbox,
  border,
  background,
  shadow,
  position,
} from 'styled-system';

const Box = styled.div`
  box-sizing: 'border-box';
  min-width: 0;
  display: ${props => (props.flex ? 'flex' : 'block')};
  text-align: left;
  ${space};
  ${color};
  ${layout};
  ${typography};
  ${flexbox};
  ${border};
  ${background}
  ${shadow};
  ${position};
  ${props => {
    if (props.flex && props.column) {
      return 'flex-direction: column;';
    }
    return null;
  }}
  ${props => {
    if (props.bold) return 'font-weight: bold;';
    return null;
  }}
`;

Box.displayName = 'Box';

export default Box;
