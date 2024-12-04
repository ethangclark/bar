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
