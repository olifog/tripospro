"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronUp } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function CommentVote({
  commentId,
  score,
  userVote,
  questionId,
  courseId,
  sort
}: {
  commentId: number;
  score: number;
  userVote: number | null;
  questionId?: number | null;
  courseId?: number | null;
  sort?: string;
}) {
  const { isSignedIn } = useUser();
  const utils = trpc.useUtils();

  // Local state tracks what we believe the current vote and score to be,
  // accounting for optimistic mutations that haven't refetched yet.
  const local = useRef({
    vote: userVote ?? 0,
    score,
    synced: true
  });

  // When props update from a refetch, sync local state
  useEffect(() => {
    local.current = { vote: userVote ?? 0, score, synced: true };
  }, [userVote, score]);

  const voteMutation = trpc.comment.vote.useMutation({
    onSettled: () => {
      if (questionId) {
        utils.comment.getByQuestion.invalidate({
          questionId,
          sort: (sort as "date_desc" | "date_asc" | "votes_desc" | "votes_asc") ?? undefined
        });
        utils.comment.getTopComment.invalidate({ questionId });
      }
      if (courseId) {
        utils.comment.getByCourse.invalidate({
          courseId,
          sort: (sort as "date_desc" | "date_asc" | "votes_desc" | "votes_asc") ?? undefined
        });
      }
    }
  });

  const handleVote = (direction: 1 | -1) => {
    const currentVote = local.current.vote;
    const newValue = currentVote === direction ? 0 : direction;
    const delta = newValue - currentVote;

    local.current = {
      vote: newValue,
      score: local.current.score + delta,
      synced: false
    };

    posthog.capture("comment_voted", {
      comment_id: commentId,
      direction: newValue === 0 ? "removed" : newValue === 1 ? "up" : "down"
    });

    voteMutation.mutate({ commentId, value: newValue });
  };

  // Display from local state when we have unsynced optimistic updates,
  // otherwise from props
  const displayVote = local.current.synced
    ? (userVote ?? 0)
    : local.current.vote;
  const displayScore = local.current.synced
    ? score
    : local.current.score;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className={cn(
          "flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground",
          displayVote === 1 && "text-orange-500 hover:text-orange-600"
        )}
        onClick={() => handleVote(1)}
        disabled={!isSignedIn}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <span
        className={cn(
          "text-[10px] font-medium leading-tight",
          displayVote === 1 && "text-orange-500",
          displayVote === -1 && "text-blue-500"
        )}
      >
        {displayScore}
      </span>
      <button
        type="button"
        className={cn(
          "flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground",
          displayVote === -1 && "text-blue-500 hover:text-blue-600"
        )}
        onClick={() => handleVote(-1)}
        disabled={!isSignedIn}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
