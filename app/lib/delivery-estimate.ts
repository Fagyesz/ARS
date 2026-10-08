const MONTHS = [
  'jan.',
  'febr.',
  'márc.',
  'ápr.',
  'máj.',
  'jún.',
  'júl.',
  'aug.',
  'szept.',
  'okt.',
  'nov.',
  'dec.',
];

type DayRange = {min: number; max: number};

/** "1–2 munkanap" -> {min: 1, max: 2}; null when the text has no number */
export function parseDayRange(text: string): DayRange | null {
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return null;
  return {min: Math.min(...numbers), max: Math.max(...numbers)};
}

/** the calendar date in Budapest as a UTC-midnight Date (safe for day maths) */
function budapestDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

/** moves `days` working days forward (Sat/Sun skipped); 0 keeps the date */
function addWorkingDays(from: Date, days: number) {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return date;
}

/**
 * Delivery window for an order placed `now`: handling plus transit working days,
 * as Hungarian text ("okt. 9–10." or "okt. 31. – nov. 3.").
 */
export function deliveryEstimate(
  now: Date,
  handling: DayRange,
  transit: DayRange,
): string {
  const today = budapestDate(now);
  const from = addWorkingDays(today, handling.min + transit.min);
  const to = addWorkingDays(today, handling.max + transit.max);
  const fromMonth = MONTHS[from.getUTCMonth()];
  const toMonth = MONTHS[to.getUTCMonth()];
  const fromDay = from.getUTCDate();
  const toDay = to.getUTCDate();

  if (from.getTime() === to.getTime()) return `${fromMonth} ${fromDay}.`;
  if (fromMonth === toMonth) return `${fromMonth} ${fromDay}–${toDay}.`;
  return `${fromMonth} ${fromDay}. – ${toMonth} ${toDay}.`;
}
