"use client";

import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import { loadSidebarState, saveSidebarState } from "@/lib/save-sidebar";
import { SidebarProvider } from "../ui/sidebar";

export function SidebarClient({
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  header: React.ReactNode;
  _content: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{props.header}</SidebarHeader>
      <SidebarContent>{props._content}</SidebarContent>
      <SidebarFooter>{props.footer}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function SavedSidebarProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const savedState = loadSidebarState();
    if (savedState) {
      setOpen(savedState.open);
    }
  }, [setOpen]);

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
