import * as React from 'react';
import { render } from 'react-testing-library';
import 'jest-dom/extend-expect';

import CreateSlate from '../../../pages/slates/create';
import { AppContext } from '../../../components/Layout';
import { proposalsArray } from '../../../utils/data';
import { EthereumContext } from '../../../components/EthereumProvider';

describe('CreateSlate', () => {
  it('should render correctly pages/slates/create form component', () => {
    const { container, getByText } = render(
      <AppContext.Provider value={{ proposals: proposalsArray }}>
        <EthereumContext.Provider value={{ contracts: {} }}>
          <CreateSlate />
        </EthereumContext.Provider>
      </AppContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(getByText('Select the grants that you would like to add to your slate')).toHaveClass(
      'mv3 f7 black-50'
    );
  });
});
