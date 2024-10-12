import { parseFullFormattedDate } from './parse-formatted-date';

describe('utils/parse-formatted-date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-02-01'));
  });

  it('should parse January 1st 2021', () => {
    expect(parseFullFormattedDate('January 1st 2021')).toEqual(
      new Date('2020-12-31T23:00:00.000Z'),
    );
  });
  it('should parse October 26th 2024', () => {
    expect(parseFullFormattedDate('October 26th 2024')).toEqual(
      new Date('2024-10-25T22:00:00.000Z'),
    );
  });
});
