"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/client";
import { ClerkProvider } from "./clerk-provider";
import { PostHogIdentify } from "./posthog-identify";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <NuqsAdapter>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClerkProvider>
            <PostHogIdentify />
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </TRPCProvider>
  );
}
