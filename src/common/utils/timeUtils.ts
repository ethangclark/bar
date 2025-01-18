import dayjs from "dayjs";

export async function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDayDate(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function formatDateTime(date: Date): string {
  return dayjs(date).format("MMM D, YYYY h:mm A");
}

export function parseDateOrNull(date: string | null): Date | null {
  if (!date) {
    return null;
  }
  const asDayjsObj = dayjs(date);
  if (!asDayjsObj.isValid()) {
    return null;
  }
  return asDayjsObj.toDate();
}
