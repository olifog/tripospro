"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { notFound } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorMessage } from "../error";
import { Skeleton } from "../ui/skeleton";

const QuestionRendererInner = ({
  paperNumber,
  year,
  questionNumber
}: { paperNumber: string; year: string; questionNumber: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  console.log(question);

  if (!question) {
    return notFound();
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-40">
          <QuestionRendererSkeleton />
        </div>
      )}

      <iframe
        src={question.url}
        className={cn("h-full w-full", isLoading && "hidden")}
        title="PDF Viewer"
        onLoad={() => setIsLoading(false)}
      >
        {question.url}
      </iframe>
    </div>
  );
};

const QuestionRendererError = () => {
  return (
    <ErrorMessage
      title="Failed to load PDF"
      description="Please refresh the page."
    />
  );
};

const QuestionRendererSkeleton = () => {
  return <Skeleton className="h-full w-full" />;
};

const QuestionRenderer = ({
  paperNumber,
  year,
  questionNumber
}: { paperNumber: string; year: string; questionNumber: string }) => {
  return (
    <ErrorBoundary fallback={<QuestionRendererError />}>
      <Suspense fallback={<QuestionRendererSkeleton />}>
        <QuestionRendererInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default QuestionRenderer;
