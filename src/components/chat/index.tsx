"use client";

import { useChat } from "@ai-sdk/react";
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

const QuestionCard = ({ questionId }: { questionId: number }) => {
  const { data: question, isLoading } =
    trpc.question.getQuestionWithContextById.useQuery({
      questionId
    });

  const { data: answers } = trpc.question.getUserAnswersByQuestionId.useQuery({
    questionId
  });

  if (isLoading) {
    return (
      <div className="h-10 w-40 animate-pulse rounded-2xl border border-gray-700 bg-gray-800 shadow-xl" />
    );
  }

  if (!question) {
    return <span className="text-gray-500 text-sm">Failed to load.</span>;
  }

  const questionUrl = `/p/${question.paperYear?.paper?.name}/${question.paperYear?.year}/${question.questionNumber}`;

  return (
    <Link href={questionUrl} target="_blank" rel="noopener noreferrer">
      <div className="flex h-10 w-46 items-center gap-2 rounded-2xl border border-gray-700 bg-gray-800 px-2 text-sm shadow-xl hover:bg-gray-900">
        <div className="flex flex-1 flex-col">
          <span className="text-gray-400 text-xs">
            {question.paperYear?.triposPartYear?.triposPart?.name}{" "}
            {question.courseYear?.course?.code}
          </span>
          <span className="text-gray-200 text-xs">
            {question.paperYear?.year} P{question.paperYear?.paper?.name} Q
            {question.questionNumber}
          </span>
        </div>
        <div className="relative flex h-5 w-5 items-center justify-center rounded-md border border-gray-200">
          {answers && answers.length > 0 && (
            <Check className="h-5 w-5 text-green-600" />
          )}
          {answers && answers.length > 1 && (
            <span className="absolute right-6 text-gray-400 text-xs">
              {answers.length}x
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const UserMessage = ({ message }: { message: UIMessage }) => {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-md rounded-xl bg-blue-700 px-3 py-2 text-sm text-white">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <Markdown key={`text-${message.id}-${index}`}>{part.text}</Markdown>
          ) : null
        )}
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: UIMessage }) => {
  // Get text content from parts
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
      <div className="prose prose-invert max-w-md rounded-xl bg-slate-800 px-3 py-2 text-slate-200 text-sm dark:bg-slate-950">
        <Markdown>{textContent}</Markdown>
      </div>
    </div>
  );
};

export const RenderMessage = ({ message }: { message: UIMessage }) => {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <>
      <AssistantMessage message={message} />
      {message.parts.map((part, index) => {
        // Handle tool parts using the typed tool-{toolName} pattern
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
                    <Loader className="h-4 w-4 animate-spin text-slate-400" />
                    <p className="text-slate-400 text-sm">
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
                    <Check className="h-4 w-4 text-slate-400" />
                    <p className="text-slate-400 text-sm">
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
                    <p className="text-red-400 text-sm">
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
                    <Loader className="h-4 w-4 animate-spin text-slate-400" />
                    <p className="text-slate-400 text-sm">
                      Preparing questions...
                    </p>
                  </div>
                );
              case "input-available":
              case "output-available": {
                // Use input for client-side tools since we provide output via addToolOutput
                const questionIds =
                  toolPart.output?.questionIds ?? toolPart.input?.questionIds;
                if (!questionIds || questionIds.length === 0) {
                  return (
                    <div
                      key={toolPart.toolCallId}
                      className="text-slate-400 text-sm"
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
                    className="text-red-400 text-sm"
                  >
                    Error displaying questions.
                  </div>
                );
              default:
                return null;
            }
          }

          // Handle dynamic tools (MCP, etc.) if any
          case "dynamic-tool": {
            const dynamicPart = part as typeof part & {
              toolName: string;
              toolCallId: string;
              state: string;
            };
            return (
              <div
                key={dynamicPart.toolCallId}
                className="flex items-center gap-2"
              >
                <Loader className="h-4 w-4 animate-spin text-slate-400" />
                <p className="text-slate-400 text-sm">
                  Running {dynamicPart.toolName}...
                </p>
              </div>
            );
          }

          // Handle step boundaries for multi-step tool calls
          case "step-start":
            // Don't show step boundaries for the first step
            return index > 0 ? (
              <div key={`step-${message.id}-${index}`} className="my-2">
                <hr className="border-slate-700" />
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

    // Automatically continue the conversation when all tool results are available
    // This enables the multi-step RAG flow:
    // 1. User asks question
    // 2. Model calls queryVectorDatabase (server-side, auto-executed)
    // 3. Model calls returnQuestions (client-side, we provide output)
    // 4. Model provides summary response
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Handle client-side tool execution
    onToolCall({ toolCall }) {
      // Check for dynamic tools first (for proper type narrowing)
      if (toolCall.dynamic) {
        return;
      }

      // returnQuestions is a client-side tool - we need to provide output
      // The input contains the questionIds to display
      if (toolCall.toolName === "returnQuestions") {
        // Provide the tool output (this doesn't execute anything,
        // just acknowledges the tool call and provides the result)
        // We return the same input as output since this tool just displays data
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

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-4 pb-32">
        {messages?.map((m) => (
          <RenderMessage key={m.id} message={m} />
        ))}
      </div>

      <form
        className="fixed bottom-0 flex w-full justify-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
      >
        <input
          className="mb-8 w-full max-w-md rounded border border-gray-300 p-2 shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
        />
      </form>
    </div>
  );
};
