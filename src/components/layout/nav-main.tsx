"use client";

import {
  Bot,
  Bug,
  ChevronRight,
  GraduationCap,
  type LucideIcon,
  Presentation,
  ScrollText,
  Trophy
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Link } from "../link/client";

type NavMainItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
  items?: NavMainItem[];
};

const navMain: NavMainItem[] = [
  {
    title: "Questions",
    url: "/questions",
    icon: ScrollText
  },
  {
    title: "RAG Bot",
    url: "/chat",
    icon: Bot
  },
  {
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
    disabled: true
  },
  {
    title: "Part II",
    url: "#",
    icon: GraduationCap,
    items: [
      {
        title: "Projects",
        url: "/part2/projects",
        icon: Bug,
        disabled: true
      },
      {
        title: "Modules",
        url: "/part2/modules",
        icon: Presentation,
        disabled: true
      }
    ]
  }
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tools</SidebarGroupLabel>
      <SidebarMenu>
        {navMain.map((item) => {
          const isActive = pathname.startsWith(item.url);

          if (item.items) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span className="text-nowrap">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            {subItem.disabled ? (
                              <div className="flex cursor-not-allowed items-center gap-2 opacity-50">
                                {subItem.icon && <subItem.icon />}
                                <span className="text-nowrap">
                                  {subItem.title}
                                </span>
                              </div>
                            ) : (
                              <Link href={subItem.url}>
                                {subItem.icon && <subItem.icon />}
                                <span className="text-nowrap">
                                  {subItem.title}
                                </span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                {item.disabled ? (
                  <div className="flex cursor-not-allowed items-center gap-2 opacity-50">
                    {item.icon && <item.icon />}
                    <span className="text-nowrap">{item.title}</span>
                  </div>
                ) : (
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span className="text-nowrap">{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
