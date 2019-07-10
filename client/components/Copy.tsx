import * as React from 'react';
import styled from 'styled-components';
import { space } from 'styled-system';
import { COLORS } from '../styles';

const StyledSectionLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 300;
  color: ${COLORS.grey2};
  line-height: 1.75rem;
  ${space};
`;

const SectionLabel: React.FunctionComponent<any> = props => {
  return <StyledSectionLabel {...props} />;
};

export default SectionLabel;
