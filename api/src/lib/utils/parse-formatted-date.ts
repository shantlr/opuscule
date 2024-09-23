const MONTH = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

export const parseFullFormattedDate = (date: string) => {
  {
    const m = date.match(
      /(?<month>January|February|March|April|May|June|July|August|September|October|November|December) (?<day>\d+)(th|st|nd|rd) (?<year>\d+)/,
    );
    if (m?.groups) {
      return new Date(
        Number(m.groups.year),
        MONTH[m.groups.month as keyof typeof MONTH],
        Number(m.groups.day),
      );
    }
  }
  console.warn(`[parseFullFormattedDate] failed to parse date: ${date}`);
};
