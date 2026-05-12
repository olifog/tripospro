"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { CommentContent } from "./comment-content";

function CommentPreviewInner({
  questionId,
  onNavigateToDiscussion
}: {
  questionId: number;
  onNavigateToDiscussion?: () => void;
}) {
  const [topComment] = trpc.comment.getTopComment.useSuspenseQuery({
    questionId
  });

  if (!topComment) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-xs">Top Comment</span>
        </div>
        {onNavigateToDiscussion ? (
          <button
            type="button"
            onClick={onNavigateToDiscussion}
            className="text-primary text-xs hover:underline"
          >
            View discussion
          </button>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          {topComment.author.crsid && (
            <Link
              href={`/profile/${topComment.author.crsid}`}
              className="font-medium hover:underline"
            >
              {topComment.author.crsid}
            </Link>
          )}
          <span className="text-muted-foreground">
            +{topComment.score}
          </span>
        </div>
        <div className="line-clamp-2 text-xs">
          <CommentContent content={topComment.content} />
        </div>
      </div>
    </div>
  );
}

export function CommentPreview({
  questionId,
  onNavigateToDiscussion
}: {
  questionId: number;
  onNavigateToDiscussion?: () => void;
}) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <CommentPreviewInner
          questionId={questionId}
          onNavigateToDiscussion={onNavigateToDiscussion}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
