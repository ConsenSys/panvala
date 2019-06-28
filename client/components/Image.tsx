import styled from 'styled-components';

const Wrapper: any = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ wide }) => (wide ? '100%' : '70%')};
  height: 100%;
  overflow: hidden;
`;

const StyledImage = styled.img`
  width: 100%;
`;

interface IProps {
  src: string;
  alt: string;
  wide?: boolean;
}

const Image: React.SFC<IProps> = ({ src, alt, wide }) => {
  return (
    <Wrapper wide={wide}>
      <StyledImage src={src} alt={alt} />
    </Wrapper>
  );
};

export default Image;
