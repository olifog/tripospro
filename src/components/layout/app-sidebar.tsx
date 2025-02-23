import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { PartSwitcher } from "@/components/layout/part-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import { HydrateClient, trpc } from "@/trpc/server";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  trpc.tripos.getTriposParts.prefetch();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <HydrateClient>
          <PartSwitcher />
        </HydrateClient>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
