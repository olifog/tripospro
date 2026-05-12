import { Chat } from "@/components/chat";
import { BackButton } from "@/components/layout/back-button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-3 px-4">
          <SidebarTrigger className="-ml-1" />
          <BackButton />
          <h1>Chat</h1>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden px-4 pb-4">
        <Chat />
      </div>
    </>
  );
}
