import { ChatPage } from "@/components/ChatPage";
import { getCurrentUser } from "@/queries/user";
import { ToolInvocation } from "ai";
import { Message, useChat } from "ai/react";
import { redirect } from "next/navigation";

export default async function Chat() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="absolute w-screen h-screen pt-32 top-0 left-0 -z-10">
      <ChatPage user={user} />
    </div>
  );
}
