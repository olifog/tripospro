"use client";

import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { ErrorMessage } from "@/components/error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { ErrorBoundary } from "react-error-boundary";

export function PartSwitcher() {
  return (
    <ErrorBoundary
      fallback={
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-12 w-full items-center p-2 group-data-[collapsible=icon]:hidden">
              <ErrorMessage
                variant="compact"
                size="sm"
                title="Failed to load parts"
                description="Please refresh the page."
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      }
    >
      <React.Suspense fallback={<PartSwitcherSkeleton />}>
        <InnerPartSwitcher />
      </React.Suspense>
    </ErrorBoundary>
  );
}

function PartSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex w-full items-center gap-2 p-2">
          <Skeleton className="size-8" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="size-4" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function InnerPartSwitcher() {
  const { isMobile } = useSidebar();

  const [{ parts, selectedPartId }] =
    trpc.tripos.getTriposPartsWithUserSelected.useSuspenseQuery();
  const sortedParts = parts.sort((a, b) => a.code.localeCompare(b.code));
  const activePart =
    sortedParts.find((part) => part.id === selectedPartId) ?? sortedParts[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activePart.code}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activePart.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Parts
            </DropdownMenuLabel>
            {sortedParts.map((part, index) => (
              <DropdownMenuItem
                key={part.name}
                onClick={() => updateUserSettings({ triposPartId: part.id })}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  {part.code}
                </div>
                {part.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
