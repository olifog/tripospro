"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Link } from "../link/client";

export type PaperCardData = {
  paperId: number;
  paperName: string;
  years: {
    year: number;
    questions: {
      questionNumber: number;
      answers?: number;
    }[];
  }[];
};

export const PaperCard = ({ paper }: { paper: PaperCardData }) => {
  const sortedYears = paper.years.sort((a, b) => b.year - a.year);

  const isMobile = useIsMobile();

  const sortedQuestions = Array.from(
    sortedYears.reduce((acc, year) => {
      for (const question of year.questions) {
        acc.add(question.questionNumber);
      }
      return acc;
    }, new Set<number>())
  ).sort((a, b) => a - b);

  return (
    <div className="absolute m-1 flex w-fit min-w-32 flex-col rounded-md border bg-card px-2 py-1 text-card-foreground shadow-sm">
      <h2 className="w-fit font-semibold text-sm">Paper {paper.paperName}</h2>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-[44px]">
          {sortedQuestions.map((question) => (
            <span
              key={question}
              className="flex h-5 w-6 items-center justify-end text-sm"
            >
              <span className="text-muted-foreground">q</span>
              {question}
            </span>
          ))}
        </div>
        <div
          className={cn("flex gap-1", isMobile && "max-w-96 overflow-x-auto")}
        >
          {sortedYears.map((year) => (
            <div key={year.year} className="flex flex-col gap-1">
              <div className="relative h-10 w-5">
                <Link href="#">
                  <span className="-rotate-90 -left-1.5 absolute top-3 text-foreground text-sm">
                    {year.year}
                  </span>
                </Link>
              </div>
              {sortedQuestions.map((question) => {
                const matchedQuestion = year.questions.find(
                  (q) => q.questionNumber === question
                );
                if (!matchedQuestion)
                  return <div key={question} className="h-5 w-5" />;
                return (
                  <Link
                    key={question}
                    href={`/p/${paper.paperName}/${year.year}/${question}`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md ${
                        matchedQuestion.answers && matchedQuestion.answers > 0
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
