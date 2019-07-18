import * as React from 'react';
import styled from 'styled-components';
import { space, typography } from 'styled-system';
import { COLORS } from '../styles';

const StyledCopy = styled.div`
  font-size: 0.85rem;
  font-weight: 300;
  color: ${COLORS.grey2};
  line-height: 1.75rem;
  ${space};
  ${typography};
`;

const Copy: React.FunctionComponent<any> = props => {
  return <StyledCopy {...props} />;
};

export default Copy;
