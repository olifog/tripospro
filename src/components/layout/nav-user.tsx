"use client";

import { SignInButton, useClerk, useUser } from "@clerk/nextjs";
import {
  BadgeCheck,
  ChevronsUpDown,
  HelpCircle,
  LogOut,
  Settings,
  User
} from "lucide-react";
import { Link } from "@/components/link/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { trpc } from "@/trpc/client";
import { getHrefWithPart } from "../link/_shared";

export function NavUser() {
  const { isMobile } = useSidebar();

  const { user, isLoaded } = useUser();
  const { data: userData, isLoading: userDataLoading } =
    trpc.user.getUserByClerkId.useQuery(
      { clerkId: user?.id as string },
      { enabled: isLoaded, retry: false }
    );
  const { signOut, openUserProfile } = useClerk();
  const [part] = usePart();

  if (!isLoaded || userDataLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-3 w-32" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (user && !userData) {
    throw new Error(
      "Something super bad happened dude. contact olifog on discord"
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {!user && (
          <div className="flex justify-center">
            <Button
              className="block group-data-[collapsible=icon]:hidden"
              variant="secondary"
              asChild
            >
              <SignInButton mode="modal" />
            </Button>
          </div>
        )}
        {user && userData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.imageUrl}
                    alt={
                      userData.crsid ??
                      user.fullName ??
                      user.primaryEmailAddress?.emailAddress
                    }
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.firstName?.charAt(0) && user.lastName?.charAt(0)
                      ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {userData.crsid ??
                      user.fullName ??
                      user.primaryEmailAddress?.emailAddress}
                  </span>
                  <span className="truncate text-xs">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.imageUrl}
                      alt={
                        userData.crsid ??
                        user.fullName ??
                        user.primaryEmailAddress?.emailAddress
                      }
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.firstName?.charAt(0) && user.lastName?.charAt(0)
                        ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {userData.crsid ??
                        user.fullName ??
                        user.primaryEmailAddress?.emailAddress}
                    </span>
                    <span className="truncate text-xs">
                      {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${userData.crsid}`}>
                    <User />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle />
                  Help
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  signOut({
                    redirectUrl: getHrefWithPart(
                      window.location.href,
                      part ?? ""
                    )
                  })
                }
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
