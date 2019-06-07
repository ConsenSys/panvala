import styled from 'styled-components';
import {
  space,
  color,
  layout,
  typography,
  border,
  background,
  shadow,
  position,
} from 'styled-system';

const Flex: any = styled.div`
  box-sizing: 'border-box';
  display: flex;
  flex-wrap: ${(props: any) => {
    if (props.wrapReverse) return 'wrap-reverse';
    else if (props.wrap) return 'wrap';
    return 'nowrap';
  }};
  justify-content: ${(props: any) => {
    if (props.justifyContent) return props.justifyContent;
    if (props.justifyCenter) return 'center';
    else if (props.justifyAround) return 'space-around';
    else if (props.justifyBetween) return 'space-between';
    else if (props.justifyEnd) return 'flex-end';
    return 'flex-start';
  }};
  align-items: ${(props: any) => {
    if (props.alignItems) return props.alignItems;
    else if (props.alignStretch) return 'stretch';
    else if (props.alignEnd) return 'flex-end';
    if (props.alignCenter) return 'center';
    else if (props.alignBaseline) return 'baseline';
    return 'flex-start';
  }};
  flex-direction: ${(props: any) => (props.column ? 'column' : 'row')};

  ${space};
  ${color};
  ${layout};
  ${typography};
  ${border};
  ${background};
  ${shadow};
  ${position};
`;

export const Column = styled.div`
  width: ${(props: any) => {
    if (props.three) return '33.33%';
    if (props.four) return '25%';
    return '50%';
  }};
  padding: ${(props: any) => (props.noPadding ? 0 : '15px')};
`;

export default Flex;
