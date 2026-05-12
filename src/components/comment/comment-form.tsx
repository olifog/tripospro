"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import { CommentContent } from "./comment-content";

const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment must be less than 10,000 characters")
});

export function CommentForm({
  questionId,
  courseId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus = false,
  placeholder = "Write a comment..."
}: {
  questionId?: number;
  courseId?: number;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const { isSignedIn } = useUser();
  const [showPreview, setShowPreview] = useState(false);
  const utils = trpc.useUtils();

  const form = useForm<z.infer<typeof commentFormSchema>>({
    defaultValues: { content: "" },
    resolver: zodResolver(commentFormSchema)
  });

  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      form.reset();
      setShowPreview(false);
      if (questionId) {
        utils.comment.getByQuestion.invalidate({ questionId });
        utils.comment.getTopComment.invalidate({ questionId });
        utils.comment.getCount.invalidate({ questionId });
      }
      if (courseId) {
        utils.comment.getByCourse.invalidate({ courseId });
        utils.comment.getCount.invalidate({ courseId });
      }
      if (parentId) {
        utils.comment.getReplies.invalidate({ parentId });
      }
      toast.success("Comment posted!");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to post comment.");
    }
  });

  if (!isSignedIn) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        Sign in to join the discussion.
      </p>
    );
  }

  async function onSubmit(values: z.infer<typeof commentFormSchema>) {
    await createComment.mutateAsync({
      content: values.content,
      questionId,
      courseId,
      parentId
    });
  }

  const content = form.watch("content");

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                {showPreview ? (
                  <div className="min-h-[4rem] rounded-md border p-3">
                    <CommentContent content={content || "*Nothing to preview*"} />
                  </div>
                ) : (
                  <Textarea
                    placeholder={placeholder}
                    className="min-h-[4rem] resize-y text-sm"
                    autoFocus={autoFocus}
                    disabled={createComment.isPending}
                    {...field}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  Preview
                </>
              )}
            </Button>
            <span className="text-muted-foreground text-xs">
              Markdown + LaTeX supported
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-7"
              disabled={createComment.isPending || !content?.trim()}
            >
              {createComment.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                parentId ? "Reply" : "Comment"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
