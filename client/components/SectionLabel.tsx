import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

const StyledSectionLabel = styled.div`
  margin: 1em 0 2em;
  font-size: 0.9em;
  font-weight: bold;
  color: ${COLORS.grey3};
`;

type Props = {};

const SectionLabel: React.FunctionComponent<Props> = props => {
  return <StyledSectionLabel {...props} />;
};

export default SectionLabel;
