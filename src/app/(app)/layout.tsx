import { AppSidebar } from "@/components/layout/app-sidebar";
import { SavedSidebarProvider } from "@/components/layout/sidebar-client";
import { SidebarInset } from "@/components/ui/sidebar";
import type { SearchParams } from "nuqs/server";

interface AppLayoutProps {
  children: React.ReactNode;
  searchParams: Promise<SearchParams>;
}

export default async function AppLayout({
  children,
  searchParams
}: AppLayoutProps) {
  return (
    <SavedSidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SavedSidebarProvider>
  );
}
