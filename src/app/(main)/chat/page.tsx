import { ChatPage } from "@/components/ChatPage";
import { getCurrentUser } from "@/queries/user";

export default async function Chat() {
  const user = await getCurrentUser();

  return (
    <div className="absolute w-screen h-screen pt-32 top-0 left-0 -z-10">
      <ChatPage user={user} />
    </div>
  );
}
