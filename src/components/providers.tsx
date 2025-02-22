"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/client";
import { ClerkProvider } from "./clerk-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </ThemeProvider>
    </TRPCProvider>
  );
}
