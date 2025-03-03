"use client";

import { ChevronsUpDown } from "lucide-react";

import { Suspense } from "react";

import { ErrorMessage } from "@/components/error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePart } from "@/hooks/use-params";
import { defaultPartCode } from "@/lib/search-params";
import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

const partAbbreviations = {
  part1a: "IA",
  part1b: "IB",
  part2: "II"
};

export function PartSwitcher() {
  return (
    <ErrorBoundary fallback={<PartSwitcherError />}>
      <Suspense fallback={<PartSwitcherSkeleton />}>
        <InnerPartSwitcher />
      </Suspense>
    </ErrorBoundary>
  );
}

function PartSwitcherError() {
  return (
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
  const [part, setPart] = usePart();
  const [parts] = trpc.tripos.getTriposParts.useSuspenseQuery();

  const sortedParts = parts?.sort((a, b) => a.code.localeCompare(b.code)) ?? [];
  const defaultPart = sortedParts.find((p) => p.code === defaultPartCode);
  if (!defaultPart) throw new Error("Default part not found");

  const activePart = sortedParts.find((p) => p.code === part);

  useEffect(() => {
    if (!part) {
      const localPart = localStorage.getItem("part");
      if (localPart && sortedParts.some((p) => p.code === localPart) && !part) {
        setPart(localPart);
      } else {
        setPart(defaultPartCode);
      }
    }
  }, []);

  const changePart = (part: string) => {
    setPart(part);
    localStorage.setItem("part", part);
  };

  if (!activePart) return <PartSwitcherSkeleton />;

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
                {
                  partAbbreviations[
                    activePart.code as keyof typeof partAbbreviations
                  ]
                }
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
                onClick={() => changePart(part.code)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  {
                    partAbbreviations[
                      part.code as keyof typeof partAbbreviations
                    ]
                  }
                </div>
                {part.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
