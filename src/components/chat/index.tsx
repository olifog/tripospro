"use client";

import { useChat } from "@ai-sdk/react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  DefaultChatTransport,
  getToolName,
  isTextUIPart,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage
} from "ai";
import { Check, ChevronDown, Loader, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";

const QuestionCard = ({ questionId }: { questionId: number }) => {
  const { data: question, isLoading } =
    trpc.question.getQuestionWithContextById.useQuery({ questionId });

  const { data: answers } = trpc.question.getUserAnswersByQuestionId.useQuery({
    questionId
  });

  if (isLoading) {
    return (
      <div className="h-12 w-44 animate-pulse rounded-md border border-border bg-muted" />
    );
  }

  if (!question) {
    return (
      <span className="text-muted-foreground text-xs">Failed to load.</span>
    );
  }

  const questionUrl = `/p/${question.paperYear?.paper?.name}/${question.paperYear?.year}/${question.questionNumber}`;
  const hasAnswers = answers && answers.length > 0;

  return (
    <Link href={questionUrl} target="_blank" rel="noopener noreferrer">
      <div
        className={cn(
          "flex h-12 w-44 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors hover:bg-accent",
          hasAnswers
            ? "border-score-distinction/40 bg-score-distinction/10"
            : "border-border bg-card"
        )}
      >
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-muted-foreground leading-tight">
            {question.paperYear?.triposPartYear?.triposPart?.name}{" "}
            {question.courseYear?.course?.code}
          </span>
          <span className="font-medium text-foreground leading-tight">
            {question.paperYear?.year} P{question.paperYear?.paper?.name} Q
            {question.questionNumber}
          </span>
        </div>
        {hasAnswers && (
          <div className="flex items-center gap-0.5">
            <Check className="h-3.5 w-3.5 text-score-distinction" />
            {answers.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                {answers.length}x
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

const UserMessage = ({ message }: { message: UIMessage }) => {
  const text = message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");

  return (
    <div className="flex w-full justify-end">
      <div className="max-w-md rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm">
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: UIMessage }) => {
  const textContent = message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");

  if (!textContent) return null;

  return (
    <div className="flex w-full items-start justify-start gap-2">
      <Image
        src="/john2.jpg"
        alt="Tripos Pro Logo"
        width={86}
        height={86}
        className="rounded-lg"
      />
      <div className="prose dark:prose-invert max-w-md rounded-lg bg-muted px-3 py-2 text-foreground text-sm">
        <Markdown>{textContent}</Markdown>
      </div>
    </div>
  );
};

type ToolCallEntry = {
  id: string;
  status: "pending" | "done" | "error";
  detail: string;
  errorText?: string;
};

type ToolGroup = {
  type: string;
  label: string;
  calls: ToolCallEntry[];
};

const TOOL_LABELS: Record<string, string> = {
  queryVectorDatabase: "Vector search",
  getQuestionDetails: "Question lookup",
  returnQuestions: "Return questions"
};

function formatToolDetail(
  toolName: string,
  input: Record<string, unknown> | undefined
): string {
  if (!input) return "";
  switch (toolName) {
    case "queryVectorDatabase": {
      const q = input.query as string | undefined;
      const y = input.year as number | undefined;
      if (!q) return "";
      return y ? `"${q}" (${y})` : `"${q}"`;
    }
    case "getQuestionDetails": {
      const p = input.paperNumber as string | undefined;
      const y = input.year as number | undefined;
      const qn = input.questionNumber as number | undefined;
      if (p && y && qn) return `${y} P${p} Q${qn}`;
      return "";
    }
    default:
      return "";
  }
}

const ToolCallGroupView = ({ group }: { group: ToolGroup }) => {
  const [open, setOpen] = useState(false);
  const pending = group.calls.filter((c) => c.status === "pending");
  const done = group.calls.filter((c) => c.status === "done");
  const errors = group.calls.filter((c) => c.status === "error");

  if (pending.length > 0) {
    const current = pending[0];
    return (
      <div className="flex items-center gap-1.5">
        <Loader className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-xs">
          {group.label}
          {current.detail && (
            <span className="text-muted-foreground/70">
              {" "}
              — {current.detail}
            </span>
          )}
          {group.calls.length > 1 && (
            <span className="text-muted-foreground/50">
              {" "}
              ({done.length}/{group.calls.length})
            </span>
          )}
          ...
        </span>
      </div>
    );
  }

  if (group.calls.length === 1) {
    const call = group.calls[0];
    return (
      <div className="flex items-center gap-1.5">
        {call.status === "error" ? (
          <span className="text-destructive text-xs">
            {group.label} failed{call.errorText && `: ${call.errorText}`}
          </span>
        ) : (
          <>
            <Check className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              {group.label}
              {call.detail && (
                <span className="text-muted-foreground/70">
                  {" "}
                  — {call.detail}
                </span>
              )}
            </span>
          </>
        )}
      </div>
    );
  }

  const summaryParts: string[] = [];
  if (done.length > 0) summaryParts.push(`${done.length} done`);
  if (errors.length > 0) summaryParts.push(`${errors.length} failed`);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
        <Check className="h-3 w-3 shrink-0" />
        <span className="text-xs">
          {group.label} ({group.calls.length})
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-150",
            !open && "-rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-0.5 flex flex-col gap-px border-border border-l pl-3">
          {group.calls.map((call) => (
            <div key={call.id} className="flex items-center gap-1">
              {call.status === "error" ? (
                <span className="text-[11px] text-destructive">
                  {call.detail || "failed"}
                  {call.errorText && ` — ${call.errorText}`}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/70">
                  {call.detail || "done"}
                </span>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const RenderMessage = ({ message }: { message: UIMessage }) => {
  const { toolGroups, questionCards } = useMemo(() => {
    const groupMap = new Map<string, ToolGroup>();
    const cards: string[][] = [];

    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue;

      const toolName = getToolName(part);
      const input = part.input as Record<string, unknown> | undefined;
      const detail = formatToolDetail(toolName, input);

      if (toolName === "returnQuestions") {
        if (
          part.state === "input-available" ||
          part.state === "output-available"
        ) {
          const p = part as typeof part & {
            input?: { questionIds: string[] };
            output?: { questionIds: string[] };
          };
          const ids = p.output?.questionIds ?? p.input?.questionIds;
          if (ids && ids.length > 0) cards.push(ids);
        }
        continue;
      }

      if (!groupMap.has(toolName)) {
        groupMap.set(toolName, {
          type: toolName,
          label: TOOL_LABELS[toolName] ?? toolName,
          calls: []
        });
      }
      const group = groupMap.get(toolName)!;

      if (
        part.state === "input-streaming" ||
        part.state === "input-available"
      ) {
        group.calls.push({
          id: part.toolCallId,
          status: "pending",
          detail
        });
      } else if (part.state === "output-available") {
        group.calls.push({
          id: part.toolCallId,
          status: "done",
          detail
        });
      } else if (part.state === "output-error") {
        group.calls.push({
          id: part.toolCallId,
          status: "error",
          detail,
          errorText: part.errorText
        });
      }
    }

    return {
      toolGroups: Array.from(groupMap.values()),
      questionCards: cards
    };
  }, [message.parts]);

  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <>
      <AssistantMessage message={message} />
      {toolGroups.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {toolGroups.map((group) => (
            <ToolCallGroupView key={group.type} group={group} />
          ))}
        </div>
      )}
      {questionCards.map((ids) => (
        <div key={ids.join(",")} className="flex max-w-xl flex-wrap gap-2">
          {ids.map((questionId) => (
            <QuestionCard
              key={questionId}
              questionId={Number.parseInt(questionId, 10)}
            />
          ))}
        </div>
      ))}
    </>
  );
};

const ThinkingIndicator = () => (
  <div className="flex items-start gap-2">
    <Image
      src="/john2.jpg"
      alt="Tripos Pro Logo"
      width={86}
      height={86}
      className="rounded-lg"
    />
    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </div>
  </div>
);

export const Chat = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Sign in to use the RAG Bot.</p>
        <Button asChild variant="secondary">
          <SignInButton mode="modal" />
        </Button>
      </div>
    );
  }

  return <ChatInner />;
};

const ChatInner = () => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, addToolOutput, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat"
    }),
    messages: [
      {
        id: "0",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Hello! Ask me any questions about the Tripos. I have access to every past paper question and can help recommend questions on topics."
          }
        ]
      }
    ],
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "returnQuestions") {
        addToolOutput({
          tool: "returnQuestions",
          toolCallId: toolCall.toolCallId,
          output: toolCall.input
        });
      }
    },
    onError(error) {
      console.error("Chat error:", error);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    sendMessage({ text: input });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageHasNoText = !lastMessage?.parts.some(
    (p) => isTextUIPart(p) && p.text.length > 0
  );
  const isThinking = status !== "ready" && lastMessageHasNoText;

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {messages?.map((m) => (
          <RenderMessage key={m.id} message={m} />
        ))}
        {isThinking && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="sticky bottom-0 flex items-end gap-2 border-border border-t bg-background pt-3 pb-4"
        onSubmit={handleSubmit}
      >
        <textarea
          ref={textareaRef}
          className="field-sizing-content max-h-32 min-h-9 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={input}
          placeholder="Ask about past papers..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status !== "ready"}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={status !== "ready" || !input.trim()}
          className="shrink-0"
        >
          {status !== "ready" ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};
