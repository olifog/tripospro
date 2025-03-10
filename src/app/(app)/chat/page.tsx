import { Chat } from "@/components/chat";
import { PageLayout } from "@/components/layout/page-layout";
import { withParamsCache } from "@/lib/with-params-cache";

function ChatPage() {
  return (
    <PageLayout header={<h1>Chat</h1>}>
      <div className="h-full w-full pt-32">
        <Chat />
      </div>
    </PageLayout>
  );
}

export default withParamsCache(ChatPage);
