import * as React from 'react';
import Link from 'next/link';
import A from './A';

interface IProps {
  children: any;
  href: string;
  as?: string;
  newTab?: boolean;
  disabled?: boolean;
}

const RouterLink: React.SFC<IProps> = ({ children, href, as, newTab, disabled }) => {
  if (disabled) {
    return children;
  }

  return (
    <Link passHref href={href} as={as ? as : href}>
      <A className="link" target={newTab ? '_blank' : undefined}>
        {children}
      </A>
    </Link>
  );
};

export default RouterLink;
