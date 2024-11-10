"use client";

import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

import { getQuestionAnswers, getQuestionByPath } from "@/queries/question";
import { RecordDone } from "./RecordDone";
import { Answers } from "./Answers";
import { getCurrentUser } from "@/queries/user";

export const RightPanel = ({
  fullScreen,
  setFullScreen,
  question,
  answers,
  user,
}: {
  fullScreen: boolean;
  setFullScreen: (value: boolean) => void;
  question: NonNullable<Awaited<ReturnType<typeof getQuestionByPath>>>;
  answers?: Awaited<ReturnType<typeof getQuestionAnswers>>;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) => {

  return (
    <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-slate-950 ml-1 flex flex-col p-2 space-y-2">
      <div className="w-full h-6 flex justify-center items-center">
        <button
          className="relative w-6 h-6 flex justify-center items-center cursor-pointer"
          onClick={() => setFullScreen(!fullScreen)}
        >
          {fullScreen ? (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          )}
        </button>
      </div>
      <h2 className="text-lg font-semibold w-full text-center">
        {question.courseYear?.year} {question.courseYear?.course.name} Q
        {question.questionNumber}
      </h2>
      <div className="mt-6 mb-2">
        <p className="text-sm text-slate-500">
          TODO: question statistics, revision tools, stopwatch, comments
        </p>
      </div>
      { !user && <p className="text-sm text-slate-500">Please login to log your answers</p> }
      { user && <>
        <RecordDone questionId={question.id} userId={user.id} />
        <Answers answers={answers} />
      </> }
    </div>
  )
};

