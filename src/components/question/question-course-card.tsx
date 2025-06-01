"use client";

import { trpc } from "@/trpc/client";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CourseCard } from "../questions/course-card";
import { Skeleton } from "../ui/skeleton";

const QuestionCourseCardInner = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  const [course] = trpc.question.getQuestionCourse.useSuspenseQuery({
    paperNumber,
    year,
    questionNumber
  });

  const lastYear = useMemo(() => {
    return Math.max(...course.years.map((year) => year.year));
  }, [course.years]);

  return (
    <div className="relative w-full">
      <CourseCard
        course={course}
        currentYear={lastYear}
        overrideFilters={{
          yearCutoff: 1993,
          search: "",
          onlyCurrent: false,
          showQuestionNumbers: true
        }}
        highlight={{
          year: Number.parseInt(year),
          questionNumber: Number.parseInt(questionNumber),
          paperNumber: paperNumber
        }}
      />
    </div>
  );
};

const QuestionCourseCardSkeleton = () => {
  return (
    <div className="relative w-full">
      <Skeleton className="h-20 w-32" />
    </div>
  );
};

const QuestionCourseCardError = ({ message }: { message: string }) => {
  return (
    <div className="text-muted-foreground text-sm">
      An error occurred while fetching the course card
    </div>
  );
};

export const QuestionCourseCard = ({
  paperNumber,
  year,
  questionNumber
}: {
  paperNumber: string;
  year: string;
  questionNumber: string;
}) => {
  return (
    <ErrorBoundary fallback={<QuestionCourseCardError message="" />}>
      <Suspense fallback={<QuestionCourseCardSkeleton />}>
        <QuestionCourseCardInner
          paperNumber={paperNumber}
          year={year}
          questionNumber={questionNumber}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
