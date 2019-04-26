import * as React from 'react';
import { withRouter } from 'next/router';
import styled from 'styled-components';
import Button from './Button';
import Image from './Image';
import NotificationPanel from './NotificationPanel';
import RouterLink from './RouterLink';

const StyledHeader = styled.header`
  margin-bottom: 2rem;
`;
const FlexContainer = styled.div`
  display: flex;
`;
const NavWrapper = styled(FlexContainer)`
  justify-content: space-between;
  align-items: center;
`;
const NavItems = styled(FlexContainer)`
  justify-content: flex-start;
`;

const Header: React.FunctionComponent<any> = ({ router, notifications }: any) => {
  return (
    <StyledHeader>
      <nav>
        <NavWrapper>
          <FlexContainer>
            <RouterLink href="/" as="/">
              <Image src="/static/logo-black.svg" alt="panvala logo" />
            </RouterLink>
          </FlexContainer>
          <NavItems>
            <RouterLink href="/" as="/">
              <Button
                active={
                  (router && router.pathname === '/') ||
                  (router && router.asPath && router.asPath.startsWith('/slates'))
                }
              >
                {'Slates'}
              </Button>
            </RouterLink>
            <RouterLink href="/proposals" as="/proposals">
              <Button active={router && router.asPath && router.asPath.startsWith('/proposals')}>
                {'Proposals'}
              </Button>
            </RouterLink>
            <RouterLink href="/ballots" as="/ballots">
              <Button active={router && router.asPath && router.asPath.startsWith('/ballots')}>
                {'Ballots'}
              </Button>
            </RouterLink>
            <NotificationPanel items={notifications} />
          </NavItems>
        </NavWrapper>
      </nav>
    </StyledHeader>
  );
};

export default withRouter(Header);
