import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Button from '../Button';

storiesOf('Button', module)
  .add('default button', () => <Button type="default">{'default'}</Button>)
  .add('first choice', () => <Button type="firstChoice">{'first'}</Button>)
  .add('second choice', () => <Button type="secondChoice">{'second'}</Button>);
