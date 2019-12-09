import React from 'react';
import styled from 'styled-components';
import { background } from 'styled-system';

const StyledSection = styled.section`
  box-sizing: 'border-box';
  ${background};
`;

const Section = props => {
  return (
    <StyledSection className="center tc" {...props}>
      {props.children}
    </StyledSection>
  );
};

export default Section;
