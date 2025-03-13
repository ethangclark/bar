import dayjs from "dayjs";

export async function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDayDate(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function formatDateTime(
  date: Date,
  mode: "excludeYear" | undefined = undefined,
): string {
  if (mode === "excludeYear") {
    return dayjs(date).format("MMM D, h:mm A");
  }
  return dayjs(date).format("MMM D, YYYY h:mm A");
}

export function parseDateOrNull(date: string | null | undefined): Date | null {
  if (!date) {
    return null;
  }
  const asDayjsObj = dayjs(date);
  if (!asDayjsObj.isValid()) {
    return null;
  }
  return asDayjsObj.toDate();
}

/**
 * Formats a date as time only if it's within the last 12 hours, otherwise as date and time
 * @param date The date to format
 * @returns A string with just the time (e.g. "3:45 PM") if recent, otherwise date and time
 */
export function formatRelativeTime(date: Date): string {
  const now = dayjs();
  const dateObj = dayjs(date);
  const hoursDiff = now.diff(dateObj, "hour");

  if (hoursDiff < 12) {
    // If less than 12 hours ago, just show the time
    return dateObj.format("h:mm A");
  } else {
    // Otherwise show the full date and time
    return formatDateTime(date);
  }
}
