import { space, width, fontSize, color } from 'styled-system';
import styled from 'styled-components';

const Box: any = styled.div`
  box-sizing: 'border-box';
  min-width: 0;
  ${space};
  ${width};
  ${fontSize};
  ${color};
`;

export default Box;
