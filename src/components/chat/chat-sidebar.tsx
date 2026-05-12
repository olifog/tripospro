"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ChatSidebar({ activeChatId }: { activeChatId: string | null }) {
  const router = useRouter();
  const { data: chats } = trpc.chat.list.useQuery();
  const utils = trpc.useUtils();
  const deleteChat = trpc.chat.delete.useMutation({
    onSuccess: (_data, variables) => {
      utils.chat.list.invalidate();
      if (variables.chatId === activeChatId) {
        router.push("/chat");
      }
    }
  });

  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-border border-r">
      <div className="flex items-center justify-between border-border border-b px-3 py-2">
        <span className="font-medium text-foreground text-xs">History</span>
        <Button asChild variant="ghost" size="icon" className="h-6 w-6">
          <Link href="/chat">
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats?.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className={cn(
              "group flex items-center gap-1 border-border border-b px-3 py-2 text-xs transition-colors hover:bg-accent",
              activeChatId === chat.id && "bg-accent"
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium text-foreground">
                {chat.title ?? "Untitled"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo(new Date(chat.updatedAt))}
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteChat.mutate({ chatId: chat.id });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Link>
        ))}
        {chats && chats.length === 0 && (
          <p className="px-3 py-4 text-center text-muted-foreground text-xs">
            No saved chats yet.
          </p>
        )}
      </div>
    </div>
  );
}
