import styled from 'styled-components';
import { layout } from 'styled-system';

const Wrapper: any = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  ${layout};
`;

const StyledImage = styled.img`
  width: 100%;
`;

interface IProps {
  src: string;
  alt: string;
  width?: string;
}

const Image: React.SFC<IProps> = ({ src, alt, width }) => {
  return (
    <Wrapper width={width}>
      <StyledImage src={src} alt={alt} />
    </Wrapper>
  );
};

export default Image;
