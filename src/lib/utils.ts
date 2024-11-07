import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const crsidFromEmail = (email: string): string | undefined => {
  if (!email.includes("@")) {
    return undefined;
  }

  if (!email.endsWith("@cam.ac.uk")) {
    return undefined;
  }

  return email.split("@")[0];
};

export const academicYearToReadable = (year: string) => {
  return `20${year.slice(0, 2)}-${year.slice(2, 4)}`;
};

const triposPartToReadableMap = {
  "1a": "IA",
  "1b": "IB",
  "2": "II",
  "2a": "IIA",
  "2b": "IIB",
  "3": "III",
};

export const triposPartToReadable = (triposPart: string) => {
  return triposPartToReadableMap[triposPart as keyof typeof triposPartToReadableMap];
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
