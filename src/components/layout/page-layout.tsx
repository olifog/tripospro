import { SidebarTrigger } from "@/components/ui/sidebar";
import { BackButton } from "./back-button";

export function PageLayout({
  children,
  header
}: { children: React.ReactNode; header: React.ReactNode }) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-3 px-4">
          <SidebarTrigger className="-ml-1" />
          <BackButton />
          {header}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
    </>
  );
}
