import { utils } from 'ethers';
import orderBy from 'lodash/orderBy';

export function sliceDecimals(floatingPt, decimalDigits = 3) {
  const point = floatingPt.indexOf('.');
  if (point === -1) {
    return floatingPt;
  }
  const integer = floatingPt.slice(0, point);
  const fractional = floatingPt.slice(point, point + decimalDigits);
  return integer + fractional;
}

function mapDatesToText(date, epochNumber) {
  const datesToText = {
    epochNumber: 'Epoch Number',
    epochStart: `Epoch ${epochNumber} Starts`,
    proposalSubmissionOpens: `Batch ${epochNumber + 1} Proposal Submission Opens`,
    proposalSubmissionCloses: `Batch ${epochNumber + 1} Proposal Submission Closes`,
    slateCreationOpens: `Batch ${epochNumber + 1} Slate Creation Opens`,
    slateCreationCloses: `Batch ${epochNumber + 1} Slate Creation Closes`,
    votingOpens: 'Voting Window Opens',
    votingCloses: 'Voting Window Closes',
    votingConcludes: `Voting Concludes`,
    nextEpochStart: `Batch ${epochNumber + 1} Tokens Released`,
  };
  return datesToText[date];
}

export function formatDates(epochDates) {
  // Get current UTS
  const nowDate = utils
    .bigNumberify(Date.now())
    .div(1000)
    .toNumber();

  // Transform into human readable dates
  const dates = Object.keys(epochDates).reduce((acc, val) => {
    const skippedDates = [
      'epochNumber',
      'proposalSubmissionOpens',
      'epochStart',
      'votingOpens',
      'votingCloses',
      'votingConcludes',
    ];
    // Skip dates
    if (skippedDates.includes(val)) {
      return acc;
    }
    return [
      ...acc,
      {
        date: epochDates[val],
        eventName: mapDatesToText(val, epochDates.epochNumber),
        eventDescription: '', // TODO: map events to descriptions
        nextEvent: false,
        expired: epochDates[val] < nowDate,
      },
    ];
  }, []);
  // console.log('dates:', dates);

  // Order dates by chronology
  return orderBy(dates, 'date');
}

export function toUSDCents(dollars) {
  if (dollars == null) return dollars;

  if (dollars.includes('.')) {
    throw new Error('Dollar value must be an integer');
  }
  const numDollars = parseInt(dollars);
  return (numDollars * 100).toString();
}

export function prettify(ugly) {
  // TEMPORARY until typescript refactor
  if (typeof ugly === 'string') {
    return utils.commify(sliceDecimals(ugly));
  }
  return ugly;
}
