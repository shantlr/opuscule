import { defaultLogger } from 'config/logger';
import dayjs from 'dayjs';

export const parseFormattedRelativeDate = (
  date: string,
  logger = defaultLogger,
) => {
  {
    const m = date.match(
      /(?<value>[\d]+) (?<unit>weeks?|days?|hours?|months?|years?|minutes?)( ago)?/,
    );
    if (m && m.groups) {
      const unit = m.groups.unit.replace(/s$/, '');
      switch (unit) {
        case 'weeks':
        case 'week': {
          return dayjs().subtract(Number(m.groups.value), 'week').toDate();
        }
        case 'minutes':
        case 'minute': {
          return dayjs()
            .subtract(Number(m.groups.value), 'minute')
            .startOf('minute')
            .toDate();
        }
        case 'hours':
        case 'hour':
          return dayjs()
            .subtract(Number(m.groups.value), 'hour')
            .startOf('hour')
            .toDate();
        case 'days':
        case 'day':
          return dayjs()
            .subtract(Number(m.groups.value), 'day')
            .startOf('day')
            .toDate();
        case 'months':
        case 'month':
          return dayjs()
            .subtract(Number(m.groups.value), 'month')
            .startOf('month')
            .toDate();
        case 'years':
        case 'year':
          return dayjs()
            .subtract(Number(m.groups.value), 'year')
            .startOf('year')
            .toDate();
        default:
      }
    }
  }

  logger.warn("Failed to parse date: '%s'", date);
  return null;
};
