import { isAfter } from 'date-fns';
import moment, { Moment } from 'moment-timezone';

export const tsToDeadline = (unixTimestamp: number, customTimezone?: string): string => {
  const fmt: string = 'YYYY-MM-DD [AT] HH:mm z';
  const deadline: Moment = moment(new Date(unixTimestamp * 1000));

  // format in local timezone
  if (typeof customTimezone === 'undefined') {
    customTimezone = moment.tz.guess();
    // console.log('deadline:', deadline.format(fmt));
  }

  // format according to given timezone
  return deadline.tz(customTimezone).format(fmt);
};

export const dateHasPassed = (uts: number) => isAfter(new Date(), new Date(uts * 1000));

export const timestamp = (): number => {
  return Math.floor(new Date().getTime() / 1000);
};
