const MONTH = {
  January: 0,
  Jan: 0,
  February: 1,
  Feb: 1,
  March: 2,
  Mar: 2,
  April: 3,
  Apr: 3,
  May: 4,
  June: 5,
  Jun: 5,
  July: 6,
  Jul: 6,
  August: 7,
  Aug: 7,
  September: 8,
  Sep: 8,
  October: 9,
  Oct: 9,
  November: 10,
  Nov: 10,
  December: 11,
  Dec: 11,
};

export const parseFullFormattedDate = (date: string) => {
  {
    const m = date.match(
      /(?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December) (?<day>\d+)(th|st|nd|rd) (?<year>\d+)/,
    );
    if (m?.groups) {
      return new Date(
        Number(m.groups.year),
        MONTH[m.groups.month as keyof typeof MONTH],
        Number(m.groups.day),
      );
    }
  }

  {
    const m = date.match(
      /(?<day>\d+) (?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December) (?<year>\d+)/,
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
