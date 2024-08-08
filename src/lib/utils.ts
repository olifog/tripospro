
export const crsidFromEmail = (email: string): string | undefined => {
  if (!email.includes("@")) {
    return undefined
  }

  if (!email.endsWith("@cam.ac.uk")) {
    return undefined
  }

  return email.split("@")[0];
}
