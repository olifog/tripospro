import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
