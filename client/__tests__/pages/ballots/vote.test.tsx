import * as React from 'react';
import { render, fireEvent, waitForElement } from 'react-testing-library';
import 'jest-dom/extend-expect';

import Vote from '../../../pages/ballots/vote';
import { slatesArray } from '../../../utils/data';
import { AppContext } from '../../../components/Layout';
import { BUTTON_COLORS, COLORS } from '../../../styles';

const oneWeekSeconds = 604800;
const epochStartDate = 1549040401;
const week11EndDate = epochStartDate + oneWeekSeconds * 11;
const week12EndDate = week11EndDate + oneWeekSeconds;
const week13EndDate = week12EndDate + oneWeekSeconds;

const currentBallot = {
  startDate: epochStartDate,
  votingOpenDate: week11EndDate,
  votingCloseDate: week12EndDate,
  finalityDate: week13EndDate,
};

const setup: any = () => {
  const { getByText, getByTestId, container } = render(
    <AppContext.Provider value={{ slates: slatesArray, currentBallot }}>
      <Vote />
    </AppContext.Provider>
  );
  const firstChoiceButton = getByText('1st Choice');
  return {
    firstChoiceButton,
    getByTestId,
    getByText,
    container,
  };
};

describe('Ballots - vote', () => {
  test.skip('should render correctly Ballot slate voting component per snapshot', () => {
    const { container } = setup();

    expect(container).toMatchSnapshot();
  });

  test('Ballots - vote', async () => {
    const { firstChoiceButton } = setup();

    // white background
    expect(firstChoiceButton).toHaveStyle(`
      background-color: ${COLORS.white}
    `);

    // click event / wait
    fireEvent.click(firstChoiceButton);
    const newButton = await waitForElement(() => firstChoiceButton);

    // green background
    expect(newButton).toHaveStyle(`
      background-color: ${BUTTON_COLORS.firstChoice}
    `);
  });
});
