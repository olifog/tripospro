import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const crsidFromEmail = (email: string): string | undefined => {
  if (!email.includes("@")) {
    return undefined
  }

  if (!email.endsWith("@cam.ac.uk")) {
    return undefined
  }

  return email.split("@")[0];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
