import styled from 'styled-components';

const Wrapper: any = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const StyledImage = styled.img`
  width: 100%;
`;

interface IProps {
  src: string;
  alt: string;
}

const Image: React.SFC<IProps> = ({ src, alt }) => {
  return (
    <Wrapper>
      <StyledImage src={src} alt={alt} />
    </Wrapper>
  );
};

export default Image;
