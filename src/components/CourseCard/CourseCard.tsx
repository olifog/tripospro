"use client";

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Link from "next/link";
import { getCourse } from "@/queries/course";
import CourseFilterContext from "../CourseFilter/courseFilterContext";
import { useContext, useMemo } from "react";
import { cn, getCurrentYear } from "@/lib/utils";

export const ClientCourseCard = ({
  course,
  tripos,
  triposPart,
  questions,
  years,
  absolute = true,
}: {
  course: NonNullable<Awaited<ReturnType<typeof getCourse>>>;
  tripos: string;
  triposPart: string;
  questions: number[];
  years: string[];
  absolute?: boolean;
}) => {
  const {
    onlyCurrent,
    yearCutoff,
    onlyExamined,
    hideCurrentYear,
    searchQuery,
  } = useContext(CourseFilterContext);
  const filteredYears = useMemo(
    () =>
      years.filter(
        (year) =>
          (yearCutoff ? parseInt(year) >= parseInt(yearCutoff) : true) &&
          (!hideCurrentYear || year !== getCurrentYear())
      ),
    [years, yearCutoff, hideCurrentYear]
  );

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        return course.CourseYear.some(
          (courseYear) =>
            (typeof yearCutoff === "undefined" ||
              parseInt(courseYear.year) >= parseInt(yearCutoff)) &&
            courseYear.Question.some((q) => q.questionNumber === question)
        );
      }),
    [questions, course.CourseYear, yearCutoff]
  );

  if (onlyCurrent && years[0] !== getCurrentYear()) return null;
  if (filteredYears.length === 0) return null;
  if (onlyExamined && filteredQuestions.length === 0) return null;
  if (
    searchQuery &&
    !course.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !course.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
    return null;

  return (
    <div
      className={cn(
        "m-1 flex flex-col bg-slate-800 border border-slate-700 rounded-md py-1 px-2 min-h-32 min-w-32 w-fit dark:bg-slate-950 dark:border-slate-800",
        absolute && "absolute"
      )}
    >
      <div className="flex h-6">
        <TooltipProvider>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Link href={`/${tripos}/${triposPart}/${course.code}`}>
                <h1 className="hover:text-slate-300 text-white font-extrabold">
                  {course.code}
                </h1>
              </Link>
            </TooltipTrigger>
            <TooltipPrimitive.Portal>
              <TooltipContent sideOffset={9}>
                <p className="text-base">{course.name}</p>
              </TooltipContent>
            </TooltipPrimitive.Portal>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex space-x-1">
        <div className="flex flex-col pt-[44px] space-y-1 mr-1">
          {filteredQuestions.map((question) => (
            <span
              className="w-4 h-5 flex justify-end items-center text-sm text-white hover:text-slate-300"
              key={question}
            >
              {question}
            </span>
          ))}
        </div>
        {filteredYears.map((year) => (
          <div key={year} className="flex flex-col space-y-1">
            <div className="relative w-5 h-10">
              <Link href={`/${tripos}/${triposPart}/${course.code}/${year}`}>
                <span className="absolute -rotate-90 -left-1.5 top-3 text-sm text-slate-200 hover:text-slate-400">
                  {year}
                </span>
              </Link>
            </div>
            {filteredQuestions.map((questionNumber) => {
              const questionYear = course.CourseYear.find(
                (courseYear) => courseYear.year === year
              );
              if (!questionYear)
                return <div key={questionNumber} className="w-5 h-5"></div>;

              const question = questionYear.Question.find(
                (question) => question.questionNumber === questionNumber
              );
              if (!question)
                return <div key={questionNumber} className="w-5 h-5"></div>;

              return (
                <Link
                  key={questionNumber}
                  href={`/${tripos}/${triposPart}/${course.code}/${year}/${question.questionNumber}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md ${
                      question._count.UserQuestionAnswer > 0
                        ? "bg-green-700"
                        : "bg-slate-600 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                    }`}
                  ></div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
