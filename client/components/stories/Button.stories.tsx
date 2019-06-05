import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Button from '../Button';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../styles';

storiesOf('Button', module)
  .add('default button', () => <Button type="default">{'default'}</Button>)
  .add('first choice', () => <Button type="firstChoice">{'first'}</Button>)
  .add('second choice', () => <Button type="secondChoice">{'second'}</Button>)
  .add('active', () => <Button active>{'active'}</Button>)
  .add('inactive', () => <Button active={false}>{'inactive'}</Button>)
  .add('wide', () => (
    <ThemeProvider theme={theme}>
      <Button type="default" width="100%">
        {'wide'}
      </Button>
    </ThemeProvider>
  ))
  .add('large', () => (
    <ThemeProvider theme={theme}>
      <Button type="default" large width="50%" color="blue">
        {'large'}
      </Button>
    </ThemeProvider>
  ));
