"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { markTextColorStyle } from "@/lib/score-colors";
import { trpc } from "@/trpc/client";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

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

  if (!results || results.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">
        Similar Questions
      </span>
      {results.map((r) => (
        <Link
          key={r.questionId}
          href={`/p/${r.paperName}/${r.year}/${r.questionNumber}`}
          className="flex items-center justify-between rounded border px-2 py-1.5 text-xs transition-colors hover:bg-muted"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">
              {r.year} P{r.paperName} Q{r.questionNumber}
            </span>
            <span className="truncate text-muted-foreground">
              {r.courseName}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {r.medianMark !== null && (
              <span
                className="font-medium"
                style={markTextColorStyle(r.medianMark)}
              >
                {r.medianMark}/20
              </span>
            )}
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {Math.round(r.score * 100)}%
            </Badge>
          </div>
        </Link>
      ))}
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
