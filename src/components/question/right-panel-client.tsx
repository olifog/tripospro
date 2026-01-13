"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash,
  TriangleAlert
} from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { ErrorMessage } from "../error";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";
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
import MarkDistributionGraph from "./mark-distribution";
import TimerComponent from "./timer";

const covidWarnings: {
  [key: string]: number[];
} = {
  part1a: [2021, 2022],
  part1b: [2021, 2022],
  part2: [2021, 2022, 2023]
};

const TitleInner = ({
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

  return (
    <h1 className="h-8 truncate text-center font-semibold text-lg">
      {!question
        ? "Failed to load question metadata."
        : `${year} ${question.courseName} Q${question.questionNumber}`}
    </h1>
  );
};

const TitleSkeleton = () => {
  return <Skeleton className="h-8 w-32" />;
};

export const Title = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <ErrorBoundary fallback={<h1>Failed to load question metadata.</h1>}>
      <Suspense fallback={<TitleSkeleton />}>
        <TitleInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export const ActionBarInner = ({
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

  console.log(question.triposPartCode);
  console.log(
    covidWarnings[question.triposPartCode as keyof typeof covidWarnings]
  );
  console.log(Number.parseInt(year, 10));

  const isCovidYear = covidWarnings[
    question.triposPartCode as keyof typeof covidWarnings
  ]?.includes(Number.parseInt(year, 10));

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline">
          {question.solutionUrl ? (
            <Link href={question.solutionUrl} target="_blank">
              Solution
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : (
            <Button variant="outline" disabled className="cursor-not-allowed">
              Solution
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </Button>
        <Button asChild variant="outline">
          <Link href={`${question.url}`} target="_blank">
            CST Link
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        {question.courseId && (
          <Button asChild variant="secondary">
            <Link href={`/course/${question.courseId}`}>Course</Link>
          </Button>
        )}
      </div>
      {isCovidYear && (
        <div className="flex w-full max-w-96 items-center justify-center gap-2 rounded-md border border-orange-900 bg-orange-500/60 p-1">
          <div className="flex h-6 w-6 items-center justify-center">
            <TriangleAlert className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-foreground text-xs">
            {year} {question.triposPartName} was open book for COVID.
          </p>
        </div>
      )}
    </div>
  );
};

export const ActionBarSkeleton = () => {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2">
      <Button variant="outline">
        Solution
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button variant="outline">
        CST Link
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button variant="secondary">Course</Button>
    </div>
  );
};

export const ActionBar = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <ErrorBoundary fallback={<div>Failed to load action bar.</div>}>
      <Suspense fallback={<ActionBarSkeleton />}>
        <ActionBarInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

const QuestionStatisticsInner = ({
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

  if (!question)
    return (
      <QuestionStatisticsError message="Failed to load question statistics." />
    );
  if (!("attempts" in question))
    return (
      <p className="text-muted-foreground text-sm">
        Please log in to see question statistics!
      </p>
    );
  if (!question.minimumMark || !question.maximumMark)
    return (
      <p className="text-muted-foreground text-sm">
        Question statistics not available for this question.
      </p>
    );

  const percentage =
    ((question.attempts ?? 0) / question.paperCandidates) * 100;
  const percentageString = percentage.toFixed(2);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <MarkDistributionGraph
        minimum={question.minimumMark}
        maximum={question.maximumMark}
        median={
          question.medianMark ??
          (question.minimumMark + question.maximumMark) / 2
        }
        attempts={question.attempts ?? 1}
      />
      {typeof question.attempts === "number" ? (
        <div className="flex h-8 flex-wrap items-center gap-1 text-nowrap text-muted-foreground text-sm">
          Attempted by{" "}
          <span className="flex items-center text-secondary-foreground">
            {question.attempts}
            <div className="text-muted-foreground">/</div>
            {question.paperCandidates < question.attempts
              ? "?"
              : question.paperCandidates}
          </span>
          <div className="flex items-center">
            {" ("}
            <span className="text-secondary-foreground">
              {question.paperCandidates === 0 ? "?" : percentageString}
            </span>
            {"%)"}
          </div>
          of students.
        </div>
      ) : (
        <p className="h-8 text-muted-foreground text-sm">
          No attempts data available for this question.
        </p>
      )}
    </div>
  );
};

const QuestionStatisticsSkeleton = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <Skeleton className="h-32 w-full max-w-[18rem]" />
      <Skeleton className="h-8 w-64" />
    </div>
  );
};

const QuestionStatisticsError = ({ message }: { message: string }) => {
  return (
    <ErrorMessage
      title="Failed to load question statistics."
      description={message}
      variant="compact"
    />
  );
};

export const QuestionStatistics = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <ErrorBoundary
      fallback={
        <QuestionStatisticsError message="Failed to load question statistics." />
      }
    >
      <Suspense fallback={<QuestionStatisticsSkeleton />}>
        <QuestionStatisticsInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

const ExaminerCommentsInner = ({
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

  const [open, setOpen] = useState(false);

  if (!question)
    return (
      <ExaminerCommentsError message="Failed to load examiner comments." />
    );
  if (!("attempts" in question))
    return (
      <p className="text-muted-foreground text-sm">
        Please log in to see examiner comments!
      </p>
    );
  if (!question.examinerComment)
    return (
      <p className="text-muted-foreground text-sm">
        No examiner comments available for this question.
      </p>
    );

  return (
    <div className="flex w-full items-center justify-center">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-md"
      >
        <Card className="w-full gap-1 py-2">
          <CardHeader className="pb-0">
            <CollapsibleTrigger asChild>
              <CardTitle className="flex cursor-pointer items-center gap-1 text-sm">
                Examiner Comments
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    !open && "rotate-[-90deg]"
                  )}
                />
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent
            className={cn(
              "animate-collapsible-down",
              "data-[state=closed]:animate-collapsible-up",
              "overflow-hidden"
            )}
          >
            <CardContent className="pt-2">
              <p className="text-xs">{question.examinerComment}</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

const ExaminerCommentsError = ({ message }: { message: string }) => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center gap-2">
      <ErrorMessage
        title="Failed to load examiner comments."
        variant="compact"
        description={message}
      />
    </div>
  );
};

const ExaminerCommentsSkeleton = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <Card className="w-full max-w-md gap-1 py-2">
        <CardHeader>
          <CardTitle className="flex cursor-pointer items-center gap-1 text-sm">
            Examiner Comments
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

export const ExaminerComments = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <ErrorBoundary fallback={<ExaminerCommentsError message="" />}>
      <Suspense fallback={<ExaminerCommentsSkeleton />}>
        <ExaminerCommentsInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
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
  return (
    <ErrorBoundary fallback={<div>Failed to load attempts.</div>}>
      <Suspense fallback={<AttemptsSkeleton />}>
        <AttemptsInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

const AttemptsSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <Skeleton className="h-10 w-full max-w-3xl px-8" />
      <Card className="w-full max-w-3xl gap-1 py-2">
        <CardHeader>
          <CardTitle className="flex cursor-pointer items-center gap-1 text-sm">
            Answer Attempts
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

const formSchema = z.object({
  timeTaken: z.coerce
    .number()
    .min(0, { message: "Time taken must be greater than 0" })
    .optional(),
  mark: z.coerce
    .number()
    .min(0, { message: "Mark must be greater than or equal to 0" })
    .max(20, { message: "Mark must be less than or equal to 20" })
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
  const [userAnswers, { refetch }] =
    trpc.question.getUserAnswers.useSuspenseQuery({
      paperNumber,
      year,
      questionNumber
    });

  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  const postUserAnswer = trpc.question.postUserAnswer.useMutation();
  const deleteUserAnswer = trpc.question.deleteUserAnswer.useMutation();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      timeTaken: undefined,
      mark: undefined,
      note: undefined
    },
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
      toast.success("Attempt submitted successfully!");
      refetch();
    } catch (_error) {
      toast.error("Failed to submit attempt.");
    }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <TimerComponent
        markDone={(time) => {
          form.setValue(
            "timeTaken",
            Number.parseInt((time / 60).toFixed(1), 10)
          );
          setModalOpen(true);
        }}
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark done</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Mark the question as done and submit your attempt!
          </DialogDescription>

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
                        Time taken
                        <span className="text-muted-foreground text-xs">
                          (minutes)
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
                        Mark
                        <span className="text-muted-foreground text-xs">
                          (/20)
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
                        placeholder="SO HARD OMG!!!"
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
                  className="flex items-center gap-0.5"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      Submitting <Loader2 className="h-4 w-4 animate-spin" />
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
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-md"
      >
        <Card className="w-full gap-1 py-2">
          <CardHeader className="pb-0">
            <CollapsibleTrigger asChild>
              <CardTitle className="flex cursor-pointer items-center gap-1 text-sm">
                Answer Attempts
                <span className="text-muted-foreground text-xs">
                  ({userAnswers.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    !open && "rotate-[-90deg]"
                  )}
                />
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent
            className={cn(
              "animate-collapsible-down",
              "data-[state=closed]:animate-collapsible-up",
              "overflow-hidden"
            )}
          >
            <CardContent className="pt-2">
              {userAnswers.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No attempts yet, get going!
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {userAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="flex w-64 flex-col gap-1 rounded-md border border-slate-800 bg-slate-700 px-2 py-0.5 text-sm text-white dark:bg-slate-900"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-bold">
                          {answer.createdAt.toLocaleDateString()}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-200 dark:text-slate-300">
                          <span className="text-xs">
                            {answer.createdAt.toLocaleTimeString()}
                          </span>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={async () => {
                              await deleteUserAnswer.mutateAsync({
                                id: answer.id
                              });
                              toast.success("Attempt deleted");
                              refetch();
                            }}
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex items-center text-slate-200 text-xs dark:text-slate-300">
                          Marks:
                          <span className="pl-1 font-bold text-slate-100">
                            {answer.mark ?? "--"}
                          </span>
                          /20
                        </div>
                        <div className="flex items-center text-slate-200 text-xs dark:text-slate-300">
                          Time Taken:
                          <span className="pr-0.5 pl-1 font-bold text-slate-100">
                            {answer.timeTaken === null
                              ? "--"
                              : `${answer.timeTaken}`}
                          </span>{" "}
                          mins
                        </div>
                      </div>
                      {answer.note && (
                        <p className="pt-0.5 pb-1 text-slate-200 text-xs dark:text-slate-300">
                          {answer.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
