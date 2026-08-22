export function formatEventDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: timezone }).format(date);
}

export function formatEventDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: timezone }).format(date);
}

export function formatEventTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone: timezone }).format(date);
}

export function formatShortDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone }).format(date);
}

export function timezoneAbbr(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short", timeZone: timezone }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
}
