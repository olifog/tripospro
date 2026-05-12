"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import { loadSidebarState, saveSidebarState } from "@/lib/save-sidebar";
import { useEffect, useRef, useState } from "react";
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
  children
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const isInitialRender = useRef(true);

  useEffect(() => {
    const savedState = loadSidebarState();
    if (savedState) {
      setOpen(savedState.open);
    }
    isInitialRender.current = false;
  }, []);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        saveSidebarState({ open: newOpen });
      }}
      style={
        isInitialRender.current
          ? { ["--sidebar-transition-duration" as string]: "0ms" }
          : undefined
      }
    >
      {children}
    </SidebarProvider>
  );
}
