"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { notFound } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorMessage } from "../error";
import { Skeleton } from "../ui/skeleton";

const QuestionRendererInner = ({
  paperNumber,
  year,
  questionNumber
}: { paperNumber: string; year: string; questionNumber: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  if (!question) {
    return notFound();
  }

  useEffect(() => {
    setIsLoading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [question.url]);

  const handleIframeLoad = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setIsLoading(false);
  };

  return (
    <div className="relative h-full min-h-3/4 w-full">
      {isLoading && (
        <div className="absolute inset-0 z-40">
          <QuestionRendererSkeleton />
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={question.url}
        className={cn("h-full w-full", isLoading && "hidden")}
        title="PDF Viewer"
        onLoad={handleIframeLoad}
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
