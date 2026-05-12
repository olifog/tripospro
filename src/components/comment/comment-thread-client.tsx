"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { CommentThreadSkeleton } from "./comment-skeleton";
import { type SortOption, CommentSort } from "./comment-sort";

export function CommentThreadClient({
  questionId,
  courseId
}: {
  questionId?: number;
  courseId?: number;
}) {
  if (questionId) {
    return <QuestionThread questionId={questionId} />;
  }
  if (courseId) {
    return <CourseThread courseId={courseId} />;
  }
  return null;
}

function QuestionThread({ questionId }: { questionId: number }) {
  const [sort, setSort] = useState<SortOption>("hot");
  const query = useQuestionComments(questionId, sort);

  return (
    <ThreadLayout
      sort={sort}
      onSortChange={setSort}
      query={query}
      questionId={questionId}
    />
  );
}

function CourseThread({ courseId }: { courseId: number }) {
  const [sort, setSort] = useState<SortOption>("hot");
  const query = useCourseComments(courseId, sort);

  return (
    <ThreadLayout
      sort={sort}
      onSortChange={setSort}
      query={query}
      courseId={courseId}
    />
  );
}

function ThreadLayout({
  sort,
  onSortChange,
  query,
  questionId,
  courseId
}: {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  query: {
    data?: { pages: { comments: any[] }[] };
    isLoading: boolean;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  };
  questionId?: number;
  courseId?: number;
}) {
  const allComments = query.data?.pages.flatMap((p) => p.comments) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Discussion</h3>
          <CommentCount questionId={questionId} courseId={courseId} />
        </div>
        <CommentSort value={sort} onChange={onSortChange} />
      </div>

      <CommentForm
        questionId={questionId}
        courseId={courseId}
        placeholder="Share your thoughts..."
      />

      {query.isLoading ? (
        <CommentThreadSkeleton />
      ) : allComments.length === 0 ? (
        <p className="py-4 text-center text-muted-foreground text-sm">
          No comments yet. Be the first to start the discussion!
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {allComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              sort={sort}
              questionId={questionId}
              courseId={courseId}
            />
          ))}
        </div>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="mx-auto"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? "Loading..." : "Load more comments"}
        </Button>
      )}
    </div>
  );
}

function CommentCount({
  questionId,
  courseId
}: {
  questionId?: number;
  courseId?: number;
}) {
  const { data } = trpc.comment.getCount.useQuery(
    { questionId, courseId },
    { enabled: !!questionId || !!courseId }
  );

  if (!data || data.count === 0) return null;

  return (
    <span className="text-muted-foreground text-xs">({data.count})</span>
  );
}

function useQuestionComments(questionId: number, sort: SortOption) {
  return trpc.comment.getByQuestion.useInfiniteQuery(
    { questionId, sort, limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: undefined
    }
  );
}

function useCourseComments(courseId: number, sort: SortOption) {
  return trpc.comment.getByCourse.useInfiniteQuery(
    { courseId, sort, limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: undefined
    }
  );
}
