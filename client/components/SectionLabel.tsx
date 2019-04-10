import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

const StyledSectionLabel = styled.div`
  margin: ${(props: any) => (props.lessMargin ? '1rem 0' : '1rem 0 2rem')};
  font-size: 0.9rem;
  font-weight: bold;
  color: ${COLORS.grey3};
`;

const SectionLabel: React.FunctionComponent<any> = props => {
  return <StyledSectionLabel {...props} />;
};

export default SectionLabel;
