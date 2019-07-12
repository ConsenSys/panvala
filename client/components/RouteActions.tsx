import * as React from 'react';
import Flex from './system/Flex';
import RouterLink from './RouterLink';
import Button from './Button';
import BackButton from './BackButton';

export default ({ href, asPath, text, disabled }: any) => (
  <Flex p={4} justifyEnd>
    <BackButton />
    <RouterLink href={href} as={asPath} disabled={disabled}>
      <Button large type="default" disabled={disabled}>
        {text}
      </Button>
    </RouterLink>
  </Flex>
);
