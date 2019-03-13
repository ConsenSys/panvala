import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

const StyledSectionLabel = styled.div`
  margin: ${(props: any) => (props.lessMargin ? '1em 0' : '1em 0 2em')};
  font-size: 0.9em;
  font-weight: bold;
  color: ${COLORS.grey3};
`;

const SectionLabel: React.FunctionComponent<any> = props => {
  return <StyledSectionLabel {...props} />;
};

export default SectionLabel;
