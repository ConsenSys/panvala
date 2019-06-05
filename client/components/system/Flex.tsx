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
    else if (props.noWrap) return 'nowrap';
    return 'wrap';
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
  align-content: ${(props: any) => {
    if (props.alignContent) return props.content;
    else if (props.contentStart) return 'flex-start';
    else if (props.contentEnd) return 'flex-end';
    else if (props.contentCenter) return 'center';
    else if (props.contentBetween) return 'space-between';
    else if (props.contentAround) return 'contentAround';
    return 'stretch';
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
