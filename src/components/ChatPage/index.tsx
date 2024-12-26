"use client";

import { triposPartToReadable } from "@/lib/utils";
import { getCurrentUser } from "@/queries/user";
import { troute } from "@/troute";
import { ToolInvocation } from "ai";
import { Message, useChat } from "ai/react";
import { Check, FileText, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

const QuestionCard = ({
  questionId,
  userId,
}: {
  questionId: number;
  userId?: string;
}) => {
  const { data: question, isLoading } = troute.getQuestionWithContextById({
    params: { questionId },
  });

  const { data: answers } = troute.getQuestionAnswers({
    params: { questionId, userId: userId || "" },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="w-40 h-10 rounded-2xl bg-gray-800 border border-gray-700 animate-pulse shadow-xl"></div>
    );
  }

  if (!question) {
    return <span className="text-sm text-gray-500">Failed to load.</span>;
  }

  const questionUrl = `/${question.courseYear.TriposPartYear?.triposPart.tripos.code ?? 'null'}` +
  `/${question.courseYear.TriposPartYear?.triposPart.name ?? 'null'}` +
  `/${question.courseYear.course.code}` +
  `/${question.courseYear.year}` +
  `/${question.questionNumber}`;

  return (
    <Link href={questionUrl} target="_blank" rel="noopener noreferrer">
      <div className="w-44 h-10 px-2 rounded-2xl bg-gray-800 border border-gray-700 shadow-xl flex items-center gap-2 text-sm hover:bg-gray-900">
        <FileText className="w-8 h-8 text-gray-400" />
        <div className="flex flex-col flex-1">
          <span className="text-gray-400 text-xs">
            {triposPartToReadable(
              question.courseYear.TriposPartYear?.triposPart.name ?? "null"
            )}{" "}
            {question.courseYear.course.code}
          </span>
          <span className="text-gray-200 text-xs">
            {question.courseYear.year} P{question.paperYear.paper.name} Q
            {question.questionNumber}
          </span>
        </div>
        <div className="relative w-5 h-5 flex items-center justify-center border border-gray-200 rounded-md">
          {answers && answers.length > 0 && (
            <Check className="w-5 h-5 text-green-600" />
          )}
          {answers && answers.length > 1 && (
            <span className="absolute right-6 text-xs text-gray-400">
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
    <div className="w-full flex justify-end">
      <div className="rounded-xl py-2 px-3 bg-blue-700 text-white max-w-md text-sm">
        <Markdown>{message.content}</Markdown>
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
  return (
    <div className="w-full flex justify-start items-start gap-2">
      <Image
        src="/john2.jpg"
        alt="Tripos Pro Logo"
        width={86}
        height={86}
        className="rounded-lg"
      />
      <div className="rounded-xl py-2 px-3 dark:bg-slate-950 bg-slate-800 text-slate-200 max-w-md text-sm prose prose-invert">
        <Markdown>{message.content}</Markdown>
      </div>
    </div>
  );
};

const RenderToolInvocation = ({
  toolInvocation,
  userId,
}: {
  toolInvocation: ToolInvocation;
  userId?: string;
}) => {
  if ("result" in toolInvocation) {
    switch (toolInvocation.toolName) {
      case "returnQuestions":
        return (
          <div className="flex flex-wrap gap-2 max-w-xl mx-auto">
            {toolInvocation.result.questionIds.map((questionId: string) => (
              <QuestionCard
                key={questionId}
                questionId={parseInt(questionId)}
                userId={userId}
              />
            ))}
          </div>
        );
      case "getTriposPart":
        return (
          <div className="flex gap-2 items-center">
            <Check className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-400">
              Checked the user&apos;s Tripos Part.
            </p>
          </div>
        );
      case "queryVectorDatabase":
        return (
          <div className="flex gap-2 items-center">
            <Check className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-400">Searched the vector DB.</p>
          </div>
        );
      default:
        return (
          <div className="flex gap-2 items-center">
            <Check className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-400">
              Tool call {toolInvocation.toolName} completed.
            </p>
          </div>
        );
    }
  }

  // otherwise calling...
  return (
    <div className="flex gap-2 items-center">
      <Loader className="w-4 h-4 text-slate-400 animate-spin" />
      <p className="text-sm text-slate-400">
        Calling {toolInvocation.toolName}...
      </p>
    </div>
  );
};

export const RenderMessage = ({
  message,
  userId,
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

export const ChatPage = ({
  user,
}: {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    maxSteps: 5,

    // run client-side tools that are automatically executed:
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "getTriposPart") {
        return user?.triposPart?.name
          ? triposPartToReadable(user.triposPart.name)
          : "Unknown";
      }
      if (toolCall.toolName === "returnQuestions") {
        return toolCall.args;
      }
    },
  });

  return (
    <div className="flex flex-col w-full h-full max-w-screen-md mx-auto gap-4 items-center">
      <div className="flex flex-col w-full gap-4 pb-32">
        {messages?.map((m: Message) => (
          <RenderMessage key={m.id} message={m} userId={user?.id} />
        ))}
      </div>

      <form
        className="w-full flex justify-center fixed bottom-0"
        onSubmit={handleSubmit}
      >
        <input
          className="w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
};
