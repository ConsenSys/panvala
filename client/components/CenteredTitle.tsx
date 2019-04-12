import * as React from 'react';
import styled from 'styled-components';

export const StyledCenteredTitle = styled.div`
  margin: 1.7em 0;
  text-align: center;
  font-family: 'Roboto';
  font-size: 2em;
  font-weight: bold;
`;
const CenteredTitle = ({ title }: { title: string }) => {
  return <StyledCenteredTitle>{title}</StyledCenteredTitle>;
};

export default CenteredTitle;
