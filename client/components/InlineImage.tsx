import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';
import Image from './Image';

const InlineImageWrapper = styled.span`
  display: inline-block;
  height: 1.3rem;
  width: 1.3rem;
  margin: 0 5px;
  border: 1px solid ${COLORS.grey4};
  padding: 2px;
`;

const InlineImage: React.SFC<any> = ({ src, alt }) => {
  return (
    <InlineImageWrapper>
      <Image src={src} alt={alt} />
    </InlineImageWrapper>
  );
};

export default InlineImage;
