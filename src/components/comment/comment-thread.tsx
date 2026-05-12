"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorMessage } from "../error";
import { CommentThreadSkeleton } from "./comment-skeleton";
import { CommentThreadClient } from "./comment-thread-client";

export function CommentThread({
  questionId,
  courseId
}: {
  questionId?: number;
  courseId?: number;
}) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorMessage
          title="Failed to load discussion."
          description="Could not load the comment thread."
          variant="compact"
        />
      }
    >
      <Suspense fallback={<CommentThreadSkeleton />}>
        <CommentThreadClient
          questionId={questionId}
          courseId={courseId}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
