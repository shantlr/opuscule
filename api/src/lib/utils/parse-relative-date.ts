import { defaultLogger } from 'config/logger';
import dayjs from 'dayjs';

export const parseFormattedRelativeDate = (
  date: string,
  logger = defaultLogger,
) => {
  {
    const m = date.match(
      /(?<value>([\d]+|a|an)) (?<unit>weeks?|days?|hours?|months?|years?|minutes?|mins?)( ago)?/,
    );
    if (m && m.groups) {
      const unit = m.groups.unit.replace(/s$/, '');
      let value: number;
      if (m.groups.value === 'a' || m.groups.value === 'an') {
        value = 1;
      } else {
        value = Number(m.groups.value);
      }

      switch (unit) {
        case 'weeks':
        case 'week': {
          return dayjs().subtract(value, 'week').toDate();
        }
        case 'min':
        case 'mins':
        case 'minutes':
        case 'minute': {
          return dayjs().subtract(value, 'minute').startOf('minute').toDate();
        }
        case 'hours':
        case 'hour':
          return dayjs().subtract(value, 'hour').startOf('hour').toDate();
        case 'days':
        case 'day':
          return dayjs().subtract(value, 'day').startOf('day').toDate();
        case 'months':
        case 'month':
          return dayjs().subtract(value, 'month').startOf('month').toDate();
        case 'years':
        case 'year':
          return dayjs().subtract(value, 'year').startOf('year').toDate();
        default:
      }
    }
  }

  logger.warn("Failed to parse date: '%s'", date);
  return null;
};
