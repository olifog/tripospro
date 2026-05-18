import { cookies } from "next/headers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SavedSidebarProvider } from "@/components/layout/sidebar-client";
import { SidebarInset } from "@/components/ui/sidebar";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : false;

  return (
    <SavedSidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SavedSidebarProvider>
  );
}
