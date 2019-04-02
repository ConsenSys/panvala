import { configure } from '@storybook/react';

const req = require.context('../components/stories', true, /.stories.tsx$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
