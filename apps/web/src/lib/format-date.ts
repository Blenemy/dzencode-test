type DateInput = Date | string | number;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, cached);
  }
  return cached;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parts(date: DateInput, timeZone?: string) {
  const values = formatter('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(date));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((part) => part.type === type)?.value ?? 0);
  return { day: get('day'), month: get('month'), year: get('year') };
}

export function monthShort(date: DateInput, locale: string, timeZone?: string): string {
  const name = formatter(locale, { month: 'short', timeZone }).format(new Date(date));
  return capitalize(name.replace('.', '').slice(0, 3));
}

export function weekdayLong(date: DateInput, locale: string, timeZone?: string): string {
  return capitalize(formatter(locale, { weekday: 'long', timeZone }).format(new Date(date)));
}

export function timeOfDay(date: DateInput, locale: string, timeZone?: string): string {
  return formatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(date));
}

export function dayMonthCommaYear(date: DateInput, locale: string, timeZone?: string): string {
  const { day, year } = parts(date, timeZone);
  return `${pad(day)} ${monthShort(date, locale, timeZone)}, ${year}`;
}

export function daySlashMonthSlashYear(date: DateInput, locale: string, timeZone = 'UTC'): string {
  const { day, year } = parts(date, timeZone);
  return `${pad(day)} / ${monthShort(date, locale, timeZone)} / ${year}`;
}

export function monthOfYear(date: DateInput, timeZone = 'UTC'): string {
  return `${pad(parts(date, timeZone).month)} / 12`;
}

export function numericDate(date: DateInput, timeZone = 'UTC'): string {
  const { day, month, year } = parts(date, timeZone);
  return `${pad(day)} / ${pad(month)} / ${year}`;
}
