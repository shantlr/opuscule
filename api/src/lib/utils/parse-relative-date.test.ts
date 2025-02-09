import { parseFormattedRelativeDate } from './parse-relative-date';

describe('utils/parse-relative-date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2021-02-01'));
  });
  it("should parse 'a'", () => {
    expect(parseFormattedRelativeDate('a minute ago')).toEqual(
      new Date('2021-01-31T23:59:00.000Z'),
    );
  });
  it("should parse 'an'", () => {
    expect(parseFormattedRelativeDate('an hour ago')).toEqual(
      new Date('2021-01-31T23:00:00.000Z'),
    );
  });
  it('should parse minutes', () => {
    expect(parseFormattedRelativeDate('31 minutes')).toEqual(
      new Date('2021-01-31T23:29:00.000Z'),
    );
  });
  it('should parse mins', () => {
    expect(parseFormattedRelativeDate('31 mins')).toEqual(
      new Date('2021-01-31T23:29:00.000Z'),
    );
  });
  it('should parse day ago', () => {
    expect(parseFormattedRelativeDate('1 day ago')).toEqual(
      new Date('2021-01-30T23:00:00.000Z'),
    );
  });
  it('should parse days ago', () => {
    expect(parseFormattedRelativeDate('2 days ago')).toEqual(
      new Date('2021-01-29T23:00:00.000Z'),
    );
  });
  it('should parse hour ago', () => {
    expect(parseFormattedRelativeDate('1 hour ago')).toEqual(
      new Date('2021-01-31T23:00:00.000Z'),
    );
  });
  it('should parse hours ago', () => {
    expect(parseFormattedRelativeDate('13 hours ago')).toEqual(
      new Date('2021-01-31T11:00:00.000Z'),
    );
  });
});
