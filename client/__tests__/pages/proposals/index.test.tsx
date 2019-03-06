import * as React from 'react';
import { render } from 'react-testing-library';
import 'jest-dom/extend-expect';

import Proposals from '../../../pages/proposals';
import { proposalsArray } from '../../../utils/data';
import { AppContext } from '../../../components/Layout';

describe('Slates', () => {
  it('should render correctly Slates component', () => {
    const proposals = render(
      <AppContext.Provider value={{ proposals: proposalsArray }}>
        <Proposals />
      </AppContext.Provider>
    );

    expect(proposals).toMatchSnapshot();
  });
});
