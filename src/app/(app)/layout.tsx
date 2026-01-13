import { AppSidebar } from "@/components/layout/app-sidebar";
import { SavedSidebarProvider } from "@/components/layout/sidebar-client";
import { SidebarInset } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  return (
    <SavedSidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SavedSidebarProvider>
  );
}
