"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuestionsFilter } from "@/hooks/use-params";
import { defaultQuestionsFilter } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Link } from "../link/client";

export type CourseCardData = {
  courseId: number;
  courseName: string;
  courseCode: string;
  years: {
    year: number;
    questions: {
      questionNumber: number;
      paperName: string;
      answers?: number;
    }[];
  }[];
};

export const CourseCard = ({
  course,
  currentYear
}: { course: CourseCardData; currentYear: number }) => {
  const [{ search, yearCutoff, onlyCurrent, showQuestionNumbers }] =
    useQuestionsFilter();

  const isCurrent = useMemo(() => {
    return course.years.some((year) => year.year === currentYear);
  }, [JSON.stringify(course.years), currentYear]);

  const matchesSearch = useMemo(() => {
    return course.courseName
      .toLowerCase()
      .includes(search?.toLowerCase() ?? "");
  }, [search, course.courseName]);

  const [sortedYears, sortedQuestions, questionMap] = useMemo(() => {
    const filteredYears = course.years.filter(
      (year) => year.year >= (yearCutoff ?? defaultQuestionsFilter.yearCutoff)
    );

    const sortedYears = filteredYears.sort((a, b) => b.year - a.year);

    const sortedQuestions = Object.values(
      sortedYears.reduce(
        (acc, year) => {
          for (const question of year.questions) {
            acc[`${question.paperName}-${question.questionNumber}`] = {
              questionNumber: question.questionNumber,
              paperName: question.paperName
            };
          }
          return acc;
        },
        {} as Record<string, { questionNumber: number; paperName: string }>
      )
    ).sort(
      (a, b) =>
        a.paperName.localeCompare(b.paperName) ||
        a.questionNumber - b.questionNumber
    );

    const questionMap: Record<number, Record<number, number | undefined>> = {};
    for (const year of sortedYears) {
      questionMap[year.year] = {};
      for (const question of year.questions) {
        questionMap[year.year][question.questionNumber] = question.answers ?? 0;
      }
    }

    return [sortedYears, sortedQuestions, questionMap];
  }, [JSON.stringify(course), yearCutoff]);

  const isMobile = useIsMobile();

  if (search && !matchesSearch) return null;
  if (onlyCurrent && !isCurrent) return null;
  if (sortedYears.length === 0) return null;

  return (
    <div className="absolute m-1 flex w-fit min-w-32 flex-col rounded-md border bg-card px-2 py-1 text-card-foreground shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {course.courseCode.length > 10 ? (
              <h2 className="w-fit font-semibold text-sm">
                {course.courseCode.slice(0, 10).trim()}...
              </h2>
            ) : (
              <h2 className="w-fit font-semibold text-sm">
                {course.courseCode}
              </h2>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{course.courseName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex gap-1">
        {showQuestionNumbers && (
          <div className="flex flex-col gap-1 pt-[44px]">
            {sortedQuestions.map((question) => (
              <span
                key={`${question.paperName}-${question.questionNumber}`}
                className="flex h-5 w-10 items-center justify-end text-sm"
              >
                <span className="text-muted-foreground">p</span>
                {question.paperName}
                <span className="text-muted-foreground">q</span>
                {question.questionNumber}
              </span>
            ))}
          </div>
        )}
        <div
          className={cn("flex gap-1", isMobile && "max-w-96 overflow-x-auto")}
        >
          {sortedYears.map((year) => (
            <div key={year.year} className="flex flex-col gap-1">
              <div className="relative h-10 w-5">
                <Link
                  href={`/c/${course.courseCode}/${year.year}`}
                  prefetch={false}
                >
                  <span className="-rotate-90 -left-1.5 absolute top-3 text-foreground text-sm">
                    {year.year}
                  </span>
                </Link>
              </div>
              {sortedQuestions.map((question) => {
                const matchedQuestionAnswers =
                  questionMap[year.year]?.[question.questionNumber];
                if (typeof matchedQuestionAnswers !== "number")
                  return showQuestionNumbers ? (
                    <div
                      key={`${question.paperName}-${question.questionNumber}`}
                      className="h-5 w-5"
                    />
                  ) : null;
                return (
                  <Link
                    key={`${question.paperName}-${question.questionNumber}`}
                    href={`/p/${question.paperName}/${year.year}/${question.questionNumber}`}
                    prefetch={false}
                  >
                    <div
                      className={`h-5 w-5 rounded-md ${
                        matchedQuestionAnswers > 0
                          ? "bg-green-700"
                          : "bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
