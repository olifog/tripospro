"use client";

import { useChat } from "@ai-sdk/react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage
} from "ai";
import { Check, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Markdown from "react-markdown";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";

const QuestionCard = ({ questionId }: { questionId: number }) => {
  const { data: question, isLoading } =
    trpc.question.getQuestionWithContextById.useQuery({ questionId });

  const { data: answers } = trpc.question.getUserAnswersByQuestionId.useQuery({
    questionId
  });

  if (isLoading) {
    return (
      <div className="h-10 w-40 animate-pulse rounded-lg border border-border bg-muted shadow-sm" />
    );
  }

  if (!question) {
    return (
      <span className="text-muted-foreground text-sm">Failed to load.</span>
    );
  }

  const questionUrl = `/p/${question.paperYear?.paper?.name}/${question.paperYear?.year}/${question.questionNumber}`;

  return (
    <Link href={questionUrl} target="_blank" rel="noopener noreferrer">
      <div className="flex h-10 w-46 items-center gap-2 rounded-lg border border-border bg-muted px-2 text-sm shadow-sm hover:bg-accent">
        <div className="flex flex-1 flex-col">
          <span className="text-muted-foreground text-xs">
            {question.paperYear?.triposPartYear?.triposPart?.name}{" "}
            {question.courseYear?.course?.code}
          </span>
          <span className="text-foreground text-xs">
            {question.paperYear?.year} P{question.paperYear?.paper?.name} Q
            {question.questionNumber}
          </span>
        </div>
        <div className="relative flex h-5 w-5 items-center justify-center rounded-md border border-border">
          {answers && answers.length > 0 && (
            <Check className="h-5 w-5 text-score-distinction" />
          )}
          {answers && answers.length > 1 && (
            <span className="absolute right-6 text-muted-foreground text-xs">
              {answers.length}x
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const UserMessage = ({ message }: { message: UIMessage }) => {
  const text = message.parts
    .filter((p) => p.type === "text")
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
    .filter(
      (part): part is typeof part & { type: "text"; text: string } =>
        part.type === "text"
    )
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

const RenderMessage = ({ message }: { message: UIMessage }) => {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <>
      <AssistantMessage message={message} />
      {message.parts.map((part, index) => {
        switch (part.type) {
          case "tool-queryVectorDatabase": {
            const toolPart = part as typeof part & {
              toolCallId: string;
              state: string;
              input?: { query: string; year?: number };
              output?: unknown;
            };

            switch (toolPart.state) {
              case "input-streaming":
              case "input-available":
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="flex items-center gap-2"
                  >
                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Searching for questions
                      {toolPart.input?.query
                        ? ` about "${toolPart.input.query}"`
                        : ""}
                      ...
                    </p>
                  </div>
                );
              case "output-available":
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Searched the vector DB.
                    </p>
                  </div>
                );
              case "output-error":
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="flex items-center gap-2"
                  >
                    <p className="text-destructive text-sm">
                      Error searching database.
                    </p>
                  </div>
                );
              default:
                return null;
            }
          }

          case "tool-returnQuestions": {
            const toolPart = part as typeof part & {
              toolCallId: string;
              state: string;
              input?: { questionIds: string[] };
              output?: { questionIds: string[] };
            };

            switch (toolPart.state) {
              case "input-streaming":
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="flex items-center gap-2"
                  >
                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Preparing questions...
                    </p>
                  </div>
                );
              case "input-available":
              case "output-available": {
                const questionIds =
                  toolPart.output?.questionIds ?? toolPart.input?.questionIds;
                if (!questionIds || questionIds.length === 0) {
                  return (
                    <div
                      key={toolPart.toolCallId}
                      className="text-muted-foreground text-sm"
                    >
                      No questions to display.
                    </div>
                  );
                }
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="mx-auto flex max-w-xl flex-wrap gap-2"
                  >
                    {questionIds.map((questionId: string) => (
                      <QuestionCard
                        key={questionId}
                        questionId={Number.parseInt(questionId, 10)}
                      />
                    ))}
                  </div>
                );
              }
              case "output-error":
                return (
                  <div
                    key={toolPart.toolCallId}
                    className="text-destructive text-sm"
                  >
                    Error displaying questions.
                  </div>
                );
              default:
                return null;
            }
          }

          case "tool-getQuestionDetails": {
            const toolPart = part as typeof part & {
              toolCallId: string;
              state: string;
              input?: {
                paperNumber: string;
                year: number;
                questionNumber: number;
              };
            };

            if (
              toolPart.state === "input-streaming" ||
              toolPart.state === "input-available"
            ) {
              return (
                <div
                  key={toolPart.toolCallId}
                  className="flex items-center gap-2"
                >
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Looking up question details
                    {toolPart.input
                      ? ` for ${toolPart.input.year} P${toolPart.input.paperNumber} Q${toolPart.input.questionNumber}`
                      : ""}
                    ...
                  </p>
                </div>
              );
            }

            if (toolPart.state === "output-available") {
              return (
                <div
                  key={toolPart.toolCallId}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Fetched question details.
                  </p>
                </div>
              );
            }

            return null;
          }

          case "step-start":
            return index > 0 ? (
              <div key={`step-${message.id}-${index}`} className="my-1">
                <hr className="border-border" />
              </div>
            ) : null;

          default:
            return null;
        }
      })}
    </>
  );
};

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-4 pb-32">
        {messages?.map((m) => (
          <RenderMessage key={m.id} message={m} />
        ))}
      </div>

      <form
        className="sticky bottom-0 flex w-full justify-center pb-8"
        onSubmit={handleSubmit}
      >
        <input
          className="w-full max-w-md rounded border border-border bg-background p-2 text-foreground shadow-sm placeholder:text-muted-foreground"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
        />
      </form>
    </div>
  );
};
