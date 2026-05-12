import { Chat } from "@/components/chat";
import { PageLayout } from "@/components/layout/page-layout";

export default async function ChatByIdPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageLayout header={<h1>Chat</h1>}>
      <div className="h-full w-full">
        <Chat chatId={id} />
      </div>
    </PageLayout>
  );
}
