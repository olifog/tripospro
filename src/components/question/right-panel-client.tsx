"use client";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExternalLink,
  FileText,
  Flag,
  Link2,
  Loader2,
  Trash,
  TriangleAlert
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { ErrorMessage } from "../error";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";
import MarkDistributionGraph from "./mark-distribution";
import TimerComponent from "./timer";

const covidWarnings: { [key: string]: number[] } = {
  part1a: [2021, 2022],
  part1b: [2021, 2022],
  part2: [2021, 2022, 2023]
};

// --- Header: title + action buttons in one row ---

const HeaderInner = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  const { isSignedIn } = useUser();
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  if (!question) return null;

  const isCovidYear =
    covidWarnings[
      question.triposPartCode as keyof typeof covidWarnings
    ]?.includes(Number.parseInt(year, 10));

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate font-medium text-sm">
          {year} {question.courseName} Q{question.questionNumber}
        </span>
        {isCovidYear && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warning" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {year} {question.triposPartName} was open book for COVID.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <TooltipProvider>
          {question.solutionUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                  <Link href={question.solutionUrl} target="_blank">
                    <FileText className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Solution</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Solution unavailable</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                <Link href={question.url} target="_blank">
                  <Link2 className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>CST Link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isSignedIn && <FlagButton questionId={question.id} />}
      </div>
    </div>
  );
};

const FlagButton = ({ questionId }: { questionId: number }) => {
  const { data } = trpc.question.getFlag.useQuery(
    { questionId },
    { retry: false }
  );
  const utils = trpc.useUtils();
  const toggleFlag = trpc.question.toggleFlag.useMutation({
    onMutate: async ({ questionId }) => {
      await utils.question.getFlag.cancel({ questionId });
      const previous = utils.question.getFlag.getData({ questionId });
      utils.question.getFlag.setData({ questionId }, (old) =>
        old ? { flagged: !old.flagged } : old
      );
      return { previous };
    },
    onError: (_err, { questionId }, context) => {
      if (context?.previous) {
        utils.question.getFlag.setData({ questionId }, context.previous);
      }
    },
    onSettled: (_data, _err, { questionId }) => {
      utils.question.getFlag.invalidate({ questionId });
      utils.triposPart.getQuestions.invalidate();
      utils.question.getQuestionCourse.invalidate();
    }
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", data?.flagged && "text-warning")}
      onClick={() => toggleFlag.mutate({ questionId })}
      disabled={toggleFlag.isPending}
    >
      <Flag className={cn("h-3.5 w-3.5", data?.flagged && "fill-current")} />
    </Button>
  );
};

export const Header = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => (
  <ErrorBoundary fallback={<div className="h-7" />}>
    <Suspense fallback={<Skeleton className="h-7 w-full" />}>
      <HeaderInner
        paperNumber={paperNumber}
        year={year}
        questionNumber={questionNumber}
      />
    </Suspense>
  </ErrorBoundary>
);

// --- Stats + Examiner Comments side by side ---

const ExaminerCommentText = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  return (
    <>
      <p ref={textRef} className="line-clamp-4 text-xs leading-relaxed">
        {text}
      </p>
      {isTruncated && (
        <button
          type="button"
          className="mt-0.5 text-primary text-xs hover:underline"
          onClick={() => setOpen(true)}
        >
          Read more
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Examiner Comments</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed">{text}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

const StatsAndCommentsInner = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  if (!question) return null;
  if (!("attempts" in question))
    return (
      <p className="text-muted-foreground text-sm">
        Sign in to see question statistics.
      </p>
    );

  const hasMarks = question.minimumMark && question.maximumMark;
  const hasExaminerComment = !!question.examinerComment;
  const percentage =
    question.paperCandidates > 0
      ? ((question.attempts ?? 0) / question.paperCandidates) * 100
      : null;

  return (
    <div className="@container flex flex-col gap-2">
      {hasMarks && (
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-[auto_1fr]">
          <MarkDistributionGraph
            minimum={question.minimumMark!}
            maximum={question.maximumMark!}
            median={
              question.medianMark ??
              (question.minimumMark! + question.maximumMark!) / 2
            }
            attempts={question.attempts ?? 1}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-muted-foreground text-xs">
              Examiner Comments
            </span>
            {hasExaminerComment ? (
              <ExaminerCommentText text={question.examinerComment!} />
            ) : (
              <p className="text-muted-foreground text-xs italic">
                No examiner comments available.
              </p>
            )}
          </div>
        </div>
      )}

      {!hasMarks && hasExaminerComment && (
        <div>
          <span className="font-medium text-muted-foreground text-xs">
            Examiner Comments
          </span>
          <div className="mt-1">
            <ExaminerCommentText text={question.examinerComment!} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {hasMarks && (
          <>
            <span>
              <span className="text-muted-foreground">Min</span>{" "}
              <span className="font-medium">{question.minimumMark}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Med</span>{" "}
              <span className="font-medium">
                {question.medianMark ?? "—"}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Max</span>{" "}
              <span className="font-medium">{question.maximumMark}</span>
            </span>
          </>
        )}
        {typeof question.attempts === "number" && (
          <span>
            <span className="font-medium">{question.attempts}</span>
            <span className="text-muted-foreground">
              /{question.paperCandidates}
            </span>
            {percentage !== null && (
              <span className="text-muted-foreground">
                {" "}
                ({percentage.toFixed(0)}%)
              </span>
            )}
          </span>
        )}
      </div>

      {!hasMarks && !hasExaminerComment && (
        <p className="text-muted-foreground text-xs">
          No statistics available for this question.
        </p>
      )}
    </div>
  );
};

export const StatsAndComments = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => (
  <ErrorBoundary
    fallback={
      <ErrorMessage
        title="Failed to load stats."
        description=""
        variant="compact"
      />
    }
  >
    <Suspense
      fallback={
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Skeleton className="h-28 w-48" />
          <Skeleton className="h-28 w-full" />
        </div>
      }
    >
      <StatsAndCommentsInner
        paperNumber={paperNumber}
        year={year}
        questionNumber={questionNumber}
      />
    </Suspense>
  </ErrorBoundary>
);

// --- Attempts (always visible, no collapsible) ---

const formSchema = z.object({
  timeTaken: z.coerce
    .number()
    .min(0, { message: "Time taken must be greater than 0" })
    .optional(),
  mark: z.coerce
    .number()
    .min(0, { message: "Mark must be >= 0" })
    .max(20, { message: "Mark must be <= 20" })
    .optional(),
  note: z
    .string()
    .max(1000, { message: "Note must be less than 1000 characters" })
    .optional()
});

const AttemptsInner = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  const queryKey = { paperNumber, year, questionNumber };
  const [userAnswers] = trpc.question.getUserAnswers.useSuspenseQuery(queryKey);
  const [question] = trpc.question.getQuestion.useSuspenseQuery(queryKey);

  const utils = trpc.useUtils();
  const postUserAnswer = trpc.question.postUserAnswer.useMutation({
    onSettled: () => {
      utils.question.getUserAnswers.invalidate(queryKey);
      utils.triposPart.getQuestions.invalidate();
      utils.question.getQuestionCourse.invalidate();
    }
  });
  const deleteUserAnswer = trpc.question.deleteUserAnswer.useMutation({
    onMutate: async ({ id }) => {
      await utils.question.getUserAnswers.cancel(queryKey);
      const previous = utils.question.getUserAnswers.getData(queryKey);
      utils.question.getUserAnswers.setData(queryKey, (old) =>
        old ? old.filter((a) => a.id !== id) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.question.getUserAnswers.setData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      utils.question.getUserAnswers.invalidate(queryKey);
      utils.triposPart.getQuestions.invalidate();
      utils.question.getQuestionCourse.invalidate();
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: { timeTaken: undefined, mark: undefined, note: undefined },
    resolver: zodResolver(formSchema)
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await postUserAnswer.mutateAsync({
        questionId: question.id,
        timeTaken: values.timeTaken,
        mark: values.mark,
        note: values.note
      });
      toast.success("Attempt submitted!");
    } catch {
      toast.error("Failed to submit attempt.");
    }
    setModalOpen(false);
  }

  const visibleAnswers = showAll ? userAnswers : userAnswers.slice(0, 5);
  const hasMore = userAnswers.length > 5 && !showAll;

  return (
    <div className="flex flex-col gap-2">
      <TimerComponent
        markDone={(time) => {
          form.setValue("timeTaken", Math.round(time / 60));
          setModalOpen(true);
        }}
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark done</DialogTitle>
          </DialogHeader>
          <DialogDescription>Submit your attempt.</DialogDescription>
          <Form {...form}>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Time{" "}
                        <span className="text-muted-foreground text-xs">
                          (min)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="30"
                          type="number"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mark{" "}
                        <span className="text-muted-foreground text-xs">
                          /20
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="15"
                          type="number"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes..."
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      Submitting <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {userAnswers.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground text-xs">
            Attempts ({userAnswers.length})
          </span>
          {visibleAnswers.map((answer) => (
            <div
              key={answer.id}
              className="flex items-center justify-between rounded border px-2 py-1 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {answer.createdAt.toLocaleDateString()}
                </span>
                {answer.mark !== null && (
                  <span className="font-medium">{answer.mark}/20</span>
                )}
                {answer.timeTaken !== null && (
                  <span className="text-muted-foreground">
                    {answer.timeTaken}m
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {answer.note && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="max-w-[8rem] truncate text-muted-foreground">
                          {answer.note}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{answer.note}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <button
                  type="button"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    deleteUserAnswer.mutate(
                      { id: answer.id },
                      { onSuccess: () => toast.success("Attempt deleted") }
                    )
                  }
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              className="text-primary text-xs hover:underline"
              onClick={() => setShowAll(true)}
            >
              Show {userAnswers.length - 5} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const Attempts = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && !isSignedIn) {
    return (
      <p className="text-center text-muted-foreground text-xs">
        Sign in to track your attempts.
      </p>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <p className="text-center text-muted-foreground text-xs">
          Failed to load attempts.
        </p>
      }
    >
      <Suspense
        fallback={
          <Skeleton className="h-9 w-full" />
        }
      >
        <AttemptsInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

