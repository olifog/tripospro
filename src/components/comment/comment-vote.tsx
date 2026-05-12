"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";

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

  const voteMutation = trpc.comment.vote.useMutation({
    onSettled: () => {
      if (questionId) {
        utils.comment.getByQuestion.invalidate({
          questionId,
          sort: (sort as "hot" | "top" | "new") ?? undefined
        });
        utils.comment.getTopComment.invalidate({ questionId });
      }
      if (courseId) {
        utils.comment.getByCourse.invalidate({
          courseId,
          sort: (sort as "hot" | "top" | "new") ?? undefined
        });
      }
    }
  });

  const handleVote = (value: 1 | -1) => {
    const newValue = userVote === value ? 0 : value;
    voteMutation.mutate({ commentId, value: newValue });
  };

  const displayScore = (() => {
    if (!voteMutation.isPending) return score;
    const oldValue = userVote ?? 0;
    const newValue = voteMutation.variables?.value ?? 0;
    return score + (newValue - oldValue);
  })();

  const currentVote = voteMutation.isPending
    ? (voteMutation.variables?.value ?? 0)
    : (userVote ?? 0);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-5 w-5",
          currentVote === 1 && "text-orange-500 hover:text-orange-600"
        )}
        onClick={() => handleVote(1)}
        disabled={voteMutation.isPending || !isSignedIn}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span
        className={cn(
          "text-xs font-medium",
          currentVote === 1 && "text-orange-500",
          currentVote === -1 && "text-blue-500"
        )}
      >
        {displayScore}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-5 w-5",
          currentVote === -1 && "text-blue-500 hover:text-blue-600"
        )}
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isPending || !isSignedIn}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
