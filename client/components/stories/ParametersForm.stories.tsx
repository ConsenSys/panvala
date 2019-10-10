import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Form, Formik } from 'formik';
import ParametersForm from '../ParametersForm';
import Box from '../system/Box';
import { StoryWrapper } from './utils.stories';

const parameters = {
  slateStakeAmount: {
    oldValue: '5000000000000000000000',
    newValue: '',
    type: 'uint256',
    key: 'slateStakeAmount',
  },
  gatekeeperAddress: {
    oldValue: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    newValue: '',
    type: 'address',
    key: 'gatekeeperAddress',
  },
};

const noop = () => {};

storiesOf('ParametersForm', module).add('ParametersForm', () => (
  <StoryWrapper>
    <Box width="620px">
      <Formik initialValues={parameters} onSubmit={noop}>
        {() => (
          <Form>
            <ParametersForm
              onChange={(name: string, value: any) => {
                console.log('name, value:', name, value);
              }}
              parameters={parameters}
            />
          </Form>
        )}
      </Formik>
    </Box>
  </StoryWrapper>
));
