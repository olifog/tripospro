"use client";

import { trpc } from "@/trpc/client";
import type { ToolInvocation } from "ai";
import { type Message, useChat } from "ai/react";
import { Check, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

const QuestionCard = ({
  questionId
}: {
  questionId: number;
}) => {
  const { data: question, isLoading } =
    trpc.question.getQuestionWithContextById.useQuery({
      questionId
    });

  const { data: answers } = trpc.question.getUserAnswersByQuestionId.useQuery({
    questionId
    // enabled: !!userId,
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
        {/* <FileText className="h-8 w-8 text-gray-400" /> */}
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

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-md rounded-xl bg-blue-700 px-3 py-2 text-sm text-white">
        <Markdown>{message.content}</Markdown>
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
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
        <Markdown>{message.content}</Markdown>
      </div>
    </div>
  );
};

const RenderToolInvocation = ({
  toolInvocation,
  userId
}: {
  toolInvocation: ToolInvocation;
  userId?: string;
}) => {
  if ("result" in toolInvocation) {
    switch (toolInvocation.toolName) {
      case "returnQuestions":
        return (
          <div className="mx-auto flex max-w-xl flex-wrap gap-2">
            {toolInvocation.result.questionIds.map((questionId: string) => (
              <QuestionCard
                key={questionId}
                questionId={Number.parseInt(questionId)}
              />
            ))}
          </div>
        );
      case "queryVectorDatabase":
        return (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-slate-400" />
            <p className="text-slate-400 text-sm">Searched the vector DB.</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-slate-400" />
            <p className="text-slate-400 text-sm">
              Tool call {toolInvocation.toolName} completed.
            </p>
          </div>
        );
    }
  }

  // otherwise calling...
  return (
    <div className="flex items-center gap-2">
      <Loader className="h-4 w-4 animate-spin text-slate-400" />
      <p className="text-slate-400 text-sm">
        Calling {toolInvocation.toolName}...
      </p>
    </div>
  );
};

export const RenderMessage = ({
  message,
  userId
}: {
  message: Message;
  userId?: string;
}) => {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <>
      {message.content && <AssistantMessage message={message} />}
      {message.toolInvocations?.map((toolInvocation: ToolInvocation) => (
        <RenderToolInvocation
          key={toolInvocation.toolCallId}
          toolInvocation={toolInvocation}
          userId={userId}
        />
      ))}
    </>
  );
};

export const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    maxSteps: 5,
    initialMessages: [
      {
        id: "0",
        role: "assistant",
        content:
          "Hello! Ask me any questions about the Tripos. I have access to every past paper question and can help recommend questions on topics."
      }
    ],

    // run client-side tools that are automatically executed:
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "returnQuestions") {
        return toolCall.args;
      }
    }
  });

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-4 pb-32">
        {messages?.map((m: Message) => (
          <RenderMessage key={m.id} message={m} />
        ))}
      </div>

      <form
        className="fixed bottom-0 flex w-full justify-center"
        onSubmit={handleSubmit}
      >
        <input
          className="mb-8 w-full max-w-md rounded border border-gray-300 p-2 shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
};
