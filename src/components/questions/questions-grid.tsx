"use client";

import { usePart } from "@/hooks/use-params";
import { defaultPartCode } from "@/lib/search-params";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const QuestionsGridInner = () => {
  const [part] = usePart();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });

  console.log(questions);
  return <div>{JSON.stringify(questions, null, 2)}</div>;
};

export const QuestionsGrid = () => {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <QuestionsGridInner />
      </Suspense>
    </ErrorBoundary>
  );
};
