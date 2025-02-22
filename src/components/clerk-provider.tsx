import { ClerkProvider as Clerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <Clerk
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined
      }}
    >
      {children}
    </Clerk>
  );
}
