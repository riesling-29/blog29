/** Format a YYYY-MM-DD calendar date for display (timezone-safe). */
function parseCalendarDate(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) {
    throw new Error(`Invalid date string: ${input}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(input: string) {
  const date = parseCalendarDate(input);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  });
}

export function formatDateShort(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) {
    throw new Error(`Invalid date string: ${input}`);
  }
  return `${match[1]}.${match[2]}.${match[3]}`;
}
