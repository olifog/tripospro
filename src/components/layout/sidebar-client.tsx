"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import { saveSidebarState } from "@/lib/save-sidebar";
import { SidebarProvider } from "../ui/sidebar";

export function SidebarClient({
  header,
  nav,
  footer,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  header: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{header}</SidebarHeader>
      <SidebarContent>{nav}</SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function SavedSidebarProvider({
  children,
  defaultOpen = true
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        saveSidebarState({ open: newOpen });
      }}
    >
      {children}
    </SidebarProvider>
  );
}
