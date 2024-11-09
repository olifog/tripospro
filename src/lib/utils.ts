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


// def academic_year_to_second_year(year):
//     tmp = int(year[2:])
//     if tmp < 90:
//         return f"20{year[2:]}"
//     else:
//         return f"19{year[2:]}"

export const academicYearToSecondYear = (academicYear: string) => {
  const tmp = parseInt(academicYear.slice(2));
  if (tmp < 90) {
    return `20${academicYear.slice(2)}`;
  } else {
    return `19${academicYear.slice(2)}`;
  }
};

export const academicYearToReadable = (academicYear: string) => {
  const tmp = parseInt(academicYear.slice(2));
  if (tmp < 90) {
    return `20${academicYear.slice(0, 2)}-${academicYear.slice(2)}`;
  } else {
    return `19${academicYear.slice(0, 2)}-${academicYear.slice(2)}`;
  }
};

export const yearToAcademicYear = (year: string) => {
  const first = (parseInt(year) - 1).toString();

  return `${first.slice(2)}${year.slice(2)}`;
}

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

export const getCurrentYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Months are 0-based in JavaScript
  const academicYearStartMonth = 9; // September

  if (month < academicYearStartMonth) {
    return year.toString()
  } else {
    return (year + 1).toString();
  }
};
