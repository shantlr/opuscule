import dayjs from 'dayjs';

export const parseFormattedRelativeDate = (date: string) => {
  {
    const m = date.match(
      /(?<value>[\d]+) (?<unit>days?|hours?|months?|years?|minutes?) ago/,
    );
    if (m && m.groups) {
      const unit = m.groups.unit.replace(/s$/, '');
      switch (unit) {
        case 'minute': {
          return dayjs()
            .subtract(Number(m.groups.value), 'minute')
            .startOf('minute')
            .toDate();
        }
        case 'hour':
          return dayjs()
            .subtract(Number(m.groups.value), 'hour')
            .startOf('hour')
            .toDate();
        case 'day':
          return dayjs()
            .subtract(Number(m.groups.value), 'day')
            .startOf('day')
            .toDate();
        case 'month':
          return dayjs()
            .subtract(Number(m.groups.value), 'month')
            .startOf('month')
            .toDate();
        case 'year':
          return dayjs()
            .subtract(Number(m.groups.value), 'year')
            .startOf('year')
            .toDate();
      }
    }
  }

  console.warn('Failed to parse date:', date);
  return null;
};
