"use client";

import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { CommentPreview, CommentThread } from "../comment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { QuestionCourseCard } from "./question-course-card";
import {
  Attempts,
  Header,
  StatsAndComments
} from "./right-panel-client";

function CommentCountBadge({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) {
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  const { data: countData } = trpc.comment.getCount.useQuery(
    { questionId: question.id },
    { enabled: !!question.id }
  );

  if (!countData || countData.count === 0) return null;

  return (
    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none">
      {countData.count}
    </span>
  );
}

export function RightPanelTabs({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) {
  const [tab, setTab] = useState("details");

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="flex h-full w-full flex-col"
    >
      <TabsList className="mx-1.5 mt-1 shrink-0">
        <TabsTrigger value="details" className="text-xs">
          Details
        </TabsTrigger>
        <TabsTrigger value="discussion" className="text-xs">
          Discussion
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <CommentCountBadge
                paperNumber={paperNumber}
                year={year}
                questionNumber={questionNumber}
              />
            </Suspense>
          </ErrorBoundary>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="mt-0 flex-1 overflow-y-auto">
        <DetailsPanel
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
          onNavigateToDiscussion={() => setTab("discussion")}
        />
      </TabsContent>
      <TabsContent value="discussion" className="mt-0 flex-1 overflow-y-auto">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <DiscussionPanelWithQuestion
              paperNumber={paperNumber}
              year={year}
              questionNumber={questionNumber}
            />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}

function DetailsPanel({
  paperNumber,
  year,
  questionNumber,
  onNavigateToDiscussion
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
  onNavigateToDiscussion: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-1.5">
      <Header
        paperNumber={paperNumber}
        year={year}
        questionNumber={questionNumber}
      />

      <div className="border-t pt-2">
        <StatsAndComments
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </div>

      <div className="border-t pt-2">
        <Attempts
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </div>

      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <CommentPreviewWithQuestion
            paperNumber={paperNumber}
            year={year}
            questionNumber={questionNumber}
            onNavigateToDiscussion={onNavigateToDiscussion}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="border-t pt-2">
        <QuestionCourseCard
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </div>
    </div>
  );
}

function CommentPreviewWithQuestion({
  paperNumber,
  year,
  questionNumber,
  onNavigateToDiscussion
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
  onNavigateToDiscussion: () => void;
}) {
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  return (
    <div className="border-t pt-2">
      <CommentPreview
        questionId={question.id}
        onNavigateToDiscussion={onNavigateToDiscussion}
      />
    </div>
  );
}

function DiscussionPanelWithQuestion({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) {
  const [question] = trpc.question.getQuestion.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  return (
    <div className="flex h-full w-full flex-col gap-2 p-1.5">
      <CommentThread questionId={question.id} />
    </div>
  );
}
