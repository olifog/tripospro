import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function calendarYearToAcademicYear(year: number) {
  // e.g. 2023 -> 2324
  // e.g. 2024 -> 2425
  const yearString = year.toString();
  const lastTwoDigits = yearString.slice(-2);
  const nextYearString = (year + 1).toString();
  const nextLastTwoDigits = nextYearString.slice(-2);
  return `${lastTwoDigits}${nextLastTwoDigits}`;
}

export function academicYearToCalendarYear(academicYear: string) {
  // e.g. 2324 -> 2023
  // e.g. 2425 -> 2024
  const firstTwoDigits = academicYear.slice(0, 2);
  if (Number.parseInt(firstTwoDigits, 10) > 92) {
    return 1900 + Number.parseInt(firstTwoDigits, 10);
  }
  return 2000 + Number.parseInt(firstTwoDigits, 10);
}
