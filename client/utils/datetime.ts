import { isAfter } from 'date-fns';
import moment, { Moment } from 'moment-timezone';

export const tsToDeadline = (unixTimestamp: number, customTimezone?: string): string => {
  const fmt: string = 'YYYY-MM-DD [AT] HH:mm A';
  const deadline: Moment = moment(new Date(unixTimestamp * 1000));

  // format in local timezone
  if (!customTimezone) {
    // console.log('deadline:', deadline.format(fmt));
    return deadline.format(fmt);
  }

  // format according to given timezone
  const dead = deadline.tz(customTimezone).format(fmt);
  // console.log('dead:', dead);
  return dead;
};

export const dateHasPassed = (uts: number) => isAfter(new Date(), new Date(uts * 1000));

export const timestamp = (): number => {
  return Math.floor((new Date()).getTime() / 1000);
};

// export const formatHtmlDatetime = date => format(date, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
// export const getEndDateString = uts => format(new Date(uts * 1000), 'MM/DD/YY_HH:mm:ss');
// export const tsToMonthDate = uts => format(new Date(uts * 1000), 'MMMM Do');
// export const difference = (date1, date2) => {
//   const MINUTE_IN_SECONDS = 60;
//   const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60;
//   const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24;

//   const totalInSeconds = differenceInSeconds(date1, date2);

//   let seconds = totalInSeconds;
//   const days = Math.floor(seconds / DAY_IN_SECONDS);

//   seconds = seconds % DAY_IN_SECONDS;
//   const hours = Math.floor(seconds / HOUR_IN_SECONDS);

//   seconds = seconds % HOUR_IN_SECONDS;
//   const minutes = Math.floor(seconds / MINUTE_IN_SECONDS);

//   seconds = seconds % MINUTE_IN_SECONDS;
//   return { days, hours, minutes, seconds, totalInSeconds };
// };
// export function timestampToExpiry(uts) {
//   const date = new Date(uts * 1000);

//   return {
//     date,
//     timestamp: uts,
//     formattedLocal: format(date, 'MMM Do, YYYY hh:mm a'),
//   };
// }
