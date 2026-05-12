"use client";

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuestionsFilter } from "@/hooks/use-params";
import { scoreColorStatic } from "@/lib/score-colors";
import { defaultQuestionsFilter } from "@/lib/search-params";
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
      bestMark?: number;
      flagged: boolean;
    }[];
  }[];
};

export const PaperCard = ({
  paper,
  currentYear
}: {
  paper: PaperCardData;
  currentYear: number;
}) => {
  const [{ search, yearCutoff, onlyCurrent, showQuestionNumbers }] =
    useQuestionsFilter();

  const isCurrent = useMemo(() => {
    return paper.years.some((year) => year.year === currentYear);
  }, [paper.years, currentYear]);

  const matchesSearch = useMemo(() => {
    return paper.paperName.toLowerCase().includes(search?.toLowerCase() ?? "");
  }, [search, paper.paperName]);

  const [sortedYears, sortedQuestions, questionMap] = useMemo(() => {
    const filteredYears = paper.years.filter(
      (year) => year.year >= (yearCutoff ?? defaultQuestionsFilter.yearCutoff)
    );

    const sortedYears = filteredYears.sort((a, b) => b.year - a.year);

    const sortedQuestions = Array.from(
      sortedYears.reduce((acc, year) => {
        for (const question of year.questions) {
          acc.add(question.questionNumber);
        }
        return acc;
      }, new Set<number>())
    ).sort((a, b) => a - b);

    const questionMap: Record<
      number,
      Record<
        number,
        { answers: number; bestMark?: number; flagged: boolean } | undefined
      >
    > = {};
    for (const year of sortedYears) {
      questionMap[year.year] = {};
      for (const question of year.questions) {
        questionMap[year.year][question.questionNumber] = {
          answers: question.answers ?? 0,
          bestMark: question.bestMark,
          flagged: question.flagged
        };
      }
    }

    return [sortedYears, sortedQuestions, questionMap];
  }, [paper, yearCutoff]);

  const isMobile = useIsMobile();

  if (search && !matchesSearch) return null;
  if (onlyCurrent && !isCurrent) return null;
  if (sortedYears.length === 0) return null;

  return (
    <div className="absolute m-1 flex w-fit min-w-32 flex-col rounded-md border bg-card px-2 py-1 text-card-foreground shadow-sm">
      <h2 className="w-fit font-semibold text-sm">Paper {paper.paperName}</h2>
      <div className="flex gap-1">
        {showQuestionNumbers && (
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
        )}
        <div
          className={cn("flex gap-1", isMobile && "max-w-96 overflow-x-auto")}
        >
          {sortedYears.map((year) => (
            <div key={year.year} className="flex flex-col gap-1">
              <div className="relative h-10 w-5">
                <Link
                  href={`/p/${paper.paperName}/${year.year}`}
                  prefetch={false}
                >
                  <span className="absolute top-3 -left-1.5 -rotate-90 text-foreground text-sm">
                    {year.year}
                  </span>
                </Link>
              </div>
              {sortedQuestions.map((question) => {
                const entry = questionMap[year.year]?.[question];
                if (!entry)
                  return showQuestionNumbers ? (
                    <div key={question} className="h-5 w-5" />
                  ) : null;
                return (
                  <Link
                    key={question}
                    href={`/p/${paper.paperName}/${year.year}/${question}`}
                    prefetch={false}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-sm",
                        entry.answers > 0
                          ? scoreColorStatic(entry.bestMark)
                          : "bg-score-unattempted/30 hover:bg-score-unattempted/50",
                        entry.flagged && "ring-2 ring-warning"
                      )}
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
