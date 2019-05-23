import * as React from 'react';
import styled from 'styled-components';

const DisplayJSON = styled.div`
  background: #f6f8fa;
  padding: 0.5rem;
`;

export default (data: any) => (
  <DisplayJSON>
    <strong>Injected data</strong>
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  </DisplayJSON>
);
