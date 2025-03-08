import { HydrateClient, trpc } from "@/trpc/server";
import type { Sidebar } from "../ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { PartSwitcher } from "./part-switcher";
import { SidebarClient } from "./sidebar-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  trpc.tripos.getTriposParts.prefetch();

  return (
    <SidebarClient
      {...props}
      header={
        <HydrateClient>
          <PartSwitcher />
        </HydrateClient>
      }
      _content={<NavMain />}
      footer={<NavUser />}
    />
  );
}
