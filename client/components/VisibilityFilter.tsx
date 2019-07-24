import * as React from 'react';
import Button from './Button';
import styled from 'styled-components';

const VisibilityFilterContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

export default ({ visibilityFilter, setVisibilityFilter }: any) => {
  function handleVisibility(filter: string) {
    setVisibilityFilter({
      Current: false,
      Past: false,
      [filter]: true,
    });
  }
  return (
    <VisibilityFilterContainer>
      <Button onClick={() => handleVisibility('Current')} active={visibilityFilter.Current}>
        {'Current'}
      </Button>
      <Button onClick={() => handleVisibility('Past')} active={visibilityFilter.Past}>
        {'Past'}
      </Button>
    </VisibilityFilterContainer>
  );
};
