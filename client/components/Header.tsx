import * as React from 'react';
import { withRouter } from 'next/router';
import Image from './Image';
import Button from './Button';
import RouterLink from './RouterLink';

const Header: React.FunctionComponent = ({ router }: any) => {
  return (
    <header className="mb4">
      <nav>
        <div className="flex justify-between items-center">
          <div className="flex">
            <RouterLink href="/" as="/">
              <Image src="/static/logo-black.svg" alt="panvala logo" />
            </RouterLink>
          </div>
          <div className="flex justify-end">
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
          </div>
        </div>
      </nav>
    </header>
  );
};

export default withRouter(Header);
