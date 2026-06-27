import { FINE_PER_DAY } from "@/types";

export function calculateFine(
  dueDate: number,
  referenceDate: number = Date.now()
): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.floor((referenceDate - dueDate) / msPerDay);
  if (overdueDays <= 0) return 0;
  return overdueDays * FINE_PER_DAY;
}

export function daysUntil(
  dueDate: number,
  referenceDate: number = Date.now()
): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((dueDate - referenceDate) / msPerDay);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}