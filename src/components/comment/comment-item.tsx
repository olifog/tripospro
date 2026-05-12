"use client";

import { useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Edit2,
  Loader2,
  Minus,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { CommentContent } from "./comment-content";
import { CommentForm } from "./comment-form";
import { CommentVote } from "./comment-vote";

const MAX_VISIBLE_DEPTH = 4;

type Comment = {
  id: number;
  authorId: number;
  parentId: number | null;
  questionId: number | null;
  courseId: number | null;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  score: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    crsid: string | null;
    name: string | null;
    picture: string | null;
  };
  userVote: number | null;
  replies: Comment[];
  hasMoreReplies: boolean;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function CommentItem({
  comment,
  sort,
  questionId,
  courseId
}: {
  comment: Comment;
  sort?: string;
  questionId?: number | null;
  courseId?: number | null;
}) {
  const { user: clerkUser } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const utils = trpc.useUtils();

  const userCrsid =
    clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0];
  const isOwn = !!(
    userCrsid &&
    comment.author.crsid &&
    userCrsid === comment.author.crsid
  );

  const updateMutation = trpc.comment.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      toast.success("Comment updated.");
      invalidateAll();
    },
    onError: () => toast.error("Failed to update comment.")
  });

  const deleteMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted.");
      setConfirmDelete(false);
      invalidateAll();
    },
    onError: () => toast.error("Failed to delete comment.")
  });

  function invalidateAll() {
    if (questionId) {
      utils.comment.getByQuestion.invalidate({ questionId });
      utils.comment.getTopComment.invalidate({ questionId });
    }
    if (courseId) {
      utils.comment.getByCourse.invalidate({ courseId });
    }
  }

  if (comment.depth >= MAX_VISIBLE_DEPTH && comment.hasMoreReplies) {
    return (
      <ContinueThread
        parentId={comment.id}
        questionId={questionId}
        courseId={courseId}
      />
    );
  }

  return (
    <div className="flex gap-1">
      {/* Left gutter: vote + collapse line */}
      <div className="flex w-5 shrink-0 flex-col items-center">
        <CommentVote
          commentId={comment.id}
          score={comment.score}
          userVote={comment.userVote}
          questionId={questionId}
          courseId={courseId}
          sort={sort}
        />
        {!collapsed ? (
          <button
            type="button"
            className="mt-0.5 flex-1 w-px bg-border hover:bg-primary transition-colors cursor-pointer"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse thread"
          />
        ) : (
          <button
            type="button"
            className="mt-0.5 flex items-center justify-center"
            onClick={() => setCollapsed(false)}
            aria-label="Expand thread"
          >
            <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Right: content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Author line */}
        <div className="flex items-center gap-1.5 text-xs">
          {comment.author.crsid ? (
            <Link
              href={`/profile/${comment.author.crsid}`}
              className="font-medium hover:underline"
            >
              {comment.author.crsid}
            </Link>
          ) : (
            <span className="text-muted-foreground">[unknown]</span>
          )}
          <span className="text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-muted-foreground">(edited)</span>
          )}
          {comment.isPinned && (
            <span className="font-medium text-primary">pinned</span>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Content or edit form */}
            {editing ? (
              <div className="my-1 flex flex-col gap-1">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[3rem] text-sm"
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-5 px-2 text-xs"
                    onClick={() =>
                      updateMutation.mutate({
                        commentId: comment.id,
                        content: editContent
                      })
                    }
                    disabled={updateMutation.isPending || !editContent.trim()}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-xs"
                    onClick={() => {
                      setEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-0.5">
                <CommentContent
                  content={comment.content}
                  className={cn(
                    comment.isDeleted && "italic text-muted-foreground"
                  )}
                />
              </div>
            )}

            {/* Action row: reply · edit · delete — all inline text */}
            {!comment.isDeleted && !editing && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {clerkUser && (
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    reply
                  </button>
                )}
                {isOwn && (
                  <>
                    <button
                      type="button"
                      className="hover:text-foreground"
                      onClick={() => setEditing(true)}
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      className="hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Delete confirmation */}
            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete comment?</DialogTitle>
                  <DialogDescription>
                    This will replace your comment with [deleted]. Replies will
                    remain visible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      deleteMutation.mutate({ commentId: comment.id })
                    }
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-1 mb-1">
                <CommentForm
                  parentId={comment.id}
                  questionId={comment.questionId ?? undefined}
                  courseId={comment.courseId ?? undefined}
                  autoFocus
                  placeholder={`Reply to ${comment.author.crsid ?? "anonymous"}...`}
                  onSuccess={() => setShowReplyForm(false)}
                  onCancel={() => setShowReplyForm(false)}
                />
              </div>
            )}

            {/* Nested replies */}
            {comment.replies.length > 0 && (
              <div className="mt-1 flex flex-col">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    sort={sort}
                    questionId={questionId}
                    courseId={courseId}
                  />
                ))}
              </div>
            )}

            {comment.hasMoreReplies &&
              comment.replies.length > 0 &&
              comment.depth < MAX_VISIBLE_DEPTH && (
                <LoadMoreReplies
                  parentId={comment.id}
                  offset={comment.replies.length}
                  questionId={questionId}
                  courseId={courseId}
                  sort={sort}
                />
              )}
          </>
        )}
      </div>
    </div>
  );
}

function ContinueThread({
  parentId,
  questionId,
  courseId
}: {
  parentId: number;
  questionId?: number | null;
  courseId?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = trpc.comment.getReplies.useQuery(
    { parentId, limit: 20 },
    { enabled: expanded }
  );

  if (!expanded) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 py-1 text-primary text-xs hover:underline"
        onClick={() => setExpanded(true)}
      >
        <CornerDownRight className="h-3 w-3" />
        Continue this thread
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="py-1 text-muted-foreground text-xs">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col">
      {data?.comments.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          questionId={questionId}
          courseId={courseId}
        />
      ))}
    </div>
  );
}

function LoadMoreReplies({
  parentId,
  offset,
  questionId,
  courseId,
  sort
}: {
  parentId: number;
  offset: number;
  questionId?: number | null;
  courseId?: number | null;
  sort?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const { data, isLoading } = trpc.comment.getReplies.useQuery(
    { parentId, cursor: offset, limit: 20 },
    { enabled: loaded }
  );

  if (!loaded) {
    return (
      <button
        type="button"
        className="flex items-center gap-1 py-0.5 text-primary text-xs hover:underline"
        onClick={() => setLoaded(true)}
      >
        <ChevronDown className="h-3 w-3" />
        more replies
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="py-1 text-muted-foreground text-xs">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col">
      {data?.comments.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          sort={sort}
          questionId={questionId}
          courseId={courseId}
        />
      ))}
    </div>
  );
}
