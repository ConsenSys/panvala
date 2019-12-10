import React from 'react';
import styled from 'styled-components';
import { background, space, shadow, border, position, color } from 'styled-system';

const StyledSection = styled.section`
  box-sizing: 'border-box';
  ${position};
  ${color};
  ${border};
  ${shadow};
  ${space};
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
