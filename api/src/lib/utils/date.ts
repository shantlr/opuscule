import dayjs from 'dayjs';

export const isElapsedFromNow = (
  date: Date | null | undefined,
  elapsed:
    | {
        hours: number;
      }
    | {
        minutes: number;
      }
    | {
        days: number;
      },
) => {
  if (!date) {
    return true;
  }

  if ('hours' in elapsed) {
    return dayjs().subtract(elapsed.hours, 'hour').isAfter(dayjs(date));
  }
  if ('minutes' in elapsed) {
    return dayjs().subtract(elapsed.minutes, 'minute').isAfter(dayjs(date));
  }
  if ('days' in elapsed) {
    return dayjs().subtract(elapsed.days, 'day').isAfter(dayjs(date));
  }

  return false;
};
