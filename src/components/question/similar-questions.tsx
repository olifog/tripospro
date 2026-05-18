"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { QuestionEntryRow } from "../question-entry";

function SimilarQuestionsInner({ questionId }: { questionId: number }) {
  const { data: results, isLoading } =
    trpc.question.getSimilarQuestions.useQuery({ questionId });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-muted-foreground text-xs">
          Similar Questions
        </span>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-xs">
        No similar questions found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">
        Similar Questions
      </span>
      <div className="flex flex-col gap-0.5">
        {results.map((r) => (
          <Link
            key={r.questionId}
            href={`/p/${r.paperName}/${r.year}/${r.questionNumber}`}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            <QuestionEntryRow
              q={{
                year: r.year,
                paperName: r.paperName,
                questionNumber: r.questionNumber,
                minimumMark: r.minimumMark,
                medianMark: r.medianMark,
                maximumMark: r.maximumMark,
                bestMark: r.bestMark,
                topics: r.topics
              }}
            />
            <Badge variant="secondary" className="ml-auto shrink-0 px-1.5 py-0 text-[10px]">
              {Math.round(r.score * 100)}%
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SimilarQuestions({ questionId }: { questionId: number }) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense
        fallback={
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-muted-foreground text-xs">
              Similar Questions
            </span>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        }
      >
        <SimilarQuestionsInner questionId={questionId} />
      </Suspense>
    </ErrorBoundary>
  );
}
