import { AppSidebar } from "@/components/layout/app-sidebar";
import { SavedSidebarProvider } from "@/components/layout/sidebar-client";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedSidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SavedSidebarProvider>
  );
}
