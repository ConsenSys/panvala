import styled from 'styled-components';
import {
  space,
  width,
  color,
  fontSize,
  display,
  height,
  justifyContent,
  flexDirection,
  alignItems,
  flexWrap,
  borders,
  boxShadow,
  position,
  zIndex,
  top,
  right,
  bottom,
  left,
} from 'styled-system';

const Box: any = styled.div`
  box-sizing: 'border-box';
  min-width: 0;

  ${space};
  ${width};
  ${color};
  ${fontSize};

  ${display};
  ${height};

  ${justifyContent};
  ${flexDirection};
  ${alignItems};
  ${flexWrap};

  ${borders};
  ${boxShadow};

  ${position};
  ${zIndex};
  ${top};
  ${right};
  ${bottom};
  ${left};
`;

Box.displayName = 'Box';

export default Box;
