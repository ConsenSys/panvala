import * as React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

const A = styled.a`
  color: inherit;
`;

interface IProps {
  children: any;
  href: string;
  as?: string;
  classNames?: string;
  newTab?: boolean;
}

const RouterLink: React.SFC<IProps> = ({ children, href, as, classNames, newTab }) => {
  return (
    <Link prefetch={process.env.NODE_ENV !== 'test'} passHref href={href} as={as}>
      <A className={`link ${classNames}`} target={newTab ? '_blank' : undefined}>
        {children}
      </A>
    </Link>
  );
};

export default RouterLink;
