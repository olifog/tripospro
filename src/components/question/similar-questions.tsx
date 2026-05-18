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
            <span className="w-10 shrink-0 font-mono text-muted-foreground">
              {r.year}
            </span>
            <span className="w-14 shrink-0 font-medium">
              P{r.paperName}Q{r.questionNumber}
            </span>
            {/* Min / Med / Max */}
            <div className="flex w-20 shrink-0 gap-0.5 font-mono text-[11px]">
              {r.minimumMark !== null ? (
                <span style={markTextColorStyle(r.minimumMark)}>{r.minimumMark}</span>
              ) : <span className="text-muted-foreground">-</span>}
              <span className="text-muted-foreground">/</span>
              {r.medianMark !== null ? (
                <span style={markTextColorStyle(r.medianMark)}>{r.medianMark}</span>
              ) : <span className="text-muted-foreground">-</span>}
              <span className="text-muted-foreground">/</span>
              {r.maximumMark !== null ? (
                <span style={markTextColorStyle(r.maximumMark)}>{r.maximumMark}</span>
              ) : <span className="text-muted-foreground">-</span>}
            </div>
            {/* User's best mark */}
            <span className="w-8 shrink-0 font-mono text-[11px]">
              {r.bestMark !== null ? (
                <span style={markTextColorStyle(r.bestMark)}>{r.bestMark}/20</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
            {/* Topics */}
            {r.topics.length > 0 && (
              <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                {r.topics.map((t) => (
                  <span
                    key={t}
                    className="truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {/* Similarity score */}
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
