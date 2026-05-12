"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";
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

  // Track our local optimistic state to avoid flicker between
  // mutation settling and query refetch completing
  const optimistic = useRef<{ vote: number; scoreDelta: number } | null>(null);

  const voteMutation = trpc.comment.vote.useMutation({
    onMutate: ({ value }) => {
      const oldValue = userVote ?? 0;
      optimistic.current = {
        vote: value,
        scoreDelta: value - oldValue
      };
    },
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

  const handleVote = (value: 1 | -1) => {
    const newValue = userVote === value ? 0 : value;
    voteMutation.mutate({ commentId, value: newValue });
  };

  // If we have a pending optimistic update and the server data hasn't
  // caught up yet (score still reflects pre-vote), keep showing optimistic.
  // Clear optimistic once server data matches.
  const opt = optimistic.current;
  let displayVote = userVote ?? 0;
  let displayScore = score;

  if (opt !== null) {
    const expectedScore = score + opt.scoreDelta;
    if (score !== expectedScore || voteMutation.isPending) {
      displayVote = opt.vote;
      displayScore = score + opt.scoreDelta;
    } else {
      optimistic.current = null;
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className={cn(
          "flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground",
          displayVote === 1 && "text-orange-500 hover:text-orange-600"
        )}
        onClick={() => handleVote(1)}
        disabled={voteMutation.isPending || !isSignedIn}
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
        disabled={voteMutation.isPending || !isSignedIn}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
