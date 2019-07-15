import * as React from 'react';
import { withRouter } from 'next/router';
import styled from 'styled-components';
import Button from './Button';
import Image from './Image';
import RouterLink from './RouterLink';
import NotificationPanel from './NotificationPanel';
import { NotificationsContext } from './NotificationsProvider';
import Flex from './system/Flex';

const StyledHeader = styled.header`
  width: 100%;
  margin-bottom: 2rem;
`;
const FlexContainer = styled.div`
  display: flex;
`;
const NavWrapper = styled(FlexContainer)`
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;
const NavItems = styled(FlexContainer)`
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
`;
const NavItem = styled(FlexContainer)`
  margin-right: 1rem;
`;

const Header: React.FunctionComponent<any> = ({ router }: any) => {
  const { notifications } = React.useContext(NotificationsContext);
  return (
    <StyledHeader>
      <nav>
        <NavWrapper>
          <Flex width={['150px']}>
            <RouterLink href="/slates" as="/slates">
              <Image src="/static/black-logo.png" alt="panvala logo" />
            </RouterLink>
          </Flex>

          <NavItems>
            <NavItem>
              <RouterLink href="/slates" as="/slates">
                <Button
                  active={
                    (router && router.pathname === '/') ||
                    (router && router.asPath && router.asPath.startsWith('/slates'))
                  }
                >
                  {'Slates'}
                </Button>
              </RouterLink>
            </NavItem>

            <NavItem>
              <RouterLink href="/proposals" as="/proposals">
                <Button active={router && router.asPath && router.asPath.startsWith('/proposals')}>
                  {'Proposals'}
                </Button>
              </RouterLink>
            </NavItem>
            <NavItem>
              <RouterLink href="/ballots" as="/ballots">
                <Button active={router && router.asPath && router.asPath.startsWith('/ballots')}>
                  {'Ballots'}
                </Button>
              </RouterLink>
            </NavItem>
            <NavItem>
              <RouterLink href="/parameters" as="/parameters">
                <Button active={router && router.asPath && router.asPath.startsWith('/parameters')}>
                  {'Parameters'}
                </Button>
              </RouterLink>
            </NavItem>
            <NotificationPanel notifications={notifications} />
          </NavItems>
        </NavWrapper>
      </nav>
    </StyledHeader>
  );
};

export default withRouter(Header);
