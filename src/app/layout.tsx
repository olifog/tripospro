import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { TrouteProvider } from "@olifog/troute";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/Header";
import { ClientRoot } from "@/components/ClientRoot";

const inter = Lato({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tripos Pro",
  description: "Tripos Pro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class">
          <TrouteProvider>
            <ClientRoot>
              {children}
            </ClientRoot>
          </TrouteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
