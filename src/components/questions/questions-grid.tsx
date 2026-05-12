"use client";

import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { usePart, useQuestionsFilter } from "@/hooks/use-params";
import { defaultPartCode, defaultQuestionsFilter } from "@/lib/search-params";
import { trpc } from "@/trpc/client";
import { ErrorMessage } from "../error";
import { MuuriGrid } from "../muuri-grid";
import { Skeleton } from "../ui/skeleton";
import { CourseCard, type CourseCardData } from "./course-card";
import { PaperCard, type PaperCardData } from "./paper-card";

const QuestionsGridInner = () => {
  const [{ view }] = useQuestionsFilter();
  const resolvedView = view ?? defaultQuestionsFilter.view;

  return (
    <div className="relative w-full">
      {resolvedView === "course" ? <CourseGrid /> : <PaperGrid />}
    </div>
  );
};

const CourseGrid = () => {
  const [part] = usePart();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });
  const { data: starredIds = [] } = trpc.course.getStarredCourses.useQuery();
  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);

  const currentYear = useMemo(() => {
    return questions.years.reduce((acc, year) => Math.max(acc, year.year), 0);
  }, [questions.years]);

  const courses = useMemo(
    () =>
      questions.years.reduce<Record<string, CourseCardData>>(
        (acc, year) => {
          for (const paper of year.papers) {
            for (const course of paper.courses) {
              if (
                course.courseId === null ||
                course.courseId === undefined ||
                course.courseName === undefined ||
                course.courseCode === undefined ||
                !paper.paperName
              )
                continue;

              const courseQuestions = paper.questions.reduce<
                {
                  questionNumber: number;
                  paperName: string;
                  answers: number | undefined;
                  bestMark: number | undefined;
                  flagged: boolean;
                }[]
              >((acc, question) => {
                if (question.courseYearId === course.courseYearId) {
                  acc.push({
                    questionNumber: question.number,
                    paperName: paper.paperName!,
                    answers: question.answers,
                    bestMark: question.bestMark,
                    flagged: question.flagged
                  });
                }
                return acc;
              }, []);

              if (acc[course.courseId]) {
                if (
                  acc[course.courseId].years.some((y) => y.year === year.year)
                ) {
                  acc[course.courseId].years
                    .find((y) => y.year === year.year)
                    ?.questions.push(...courseQuestions);
                } else {
                  acc[course.courseId].years.push({
                    year: year.year,
                    questions: courseQuestions
                  });
                }
              } else {
                acc[course.courseId] = {
                  courseId: course.courseId,
                  courseName: course.courseName,
                  courseCode: course.courseCode,
                  years: [{ year: year.year, questions: courseQuestions }]
                };
              }
            }
          }
          return acc;
        },
        {} as Record<string, CourseCardData>
      ),
    [questions]
  );

  return (
    <MuuriGrid emptyMessage="No courses match your filters.">
      {Object.values(courses).map((course) => (
        <CourseCard
          key={course.courseId}
          course={course}
          currentYear={currentYear}
          starredCourseIds={starredSet}
        />
      ))}
    </MuuriGrid>
  );
};

const PaperGrid = () => {
  const [part] = usePart();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });

  const currentYear = useMemo(() => {
    return questions.years.reduce((acc, year) => Math.max(acc, year.year), 0);
  }, [questions.years]);

  const papers = useMemo(() => {
    return questions.years.reduce<Record<string, PaperCardData>>(
      (acc, year) => {
        for (const paper of year.papers) {
          if (!paper.paperName || paper.paperId === null) continue;

          const paperQuestions = paper.questions.map((question) => ({
            questionNumber: question.number,
            answers: question.answers,
            bestMark: question.bestMark,
            flagged: question.flagged
          }));

          if (acc[paper.paperId]) {
            acc[paper.paperId].years.push({
              year: year.year,
              questions: paperQuestions
            });
          } else {
            acc[paper.paperId] = {
              paperId: paper.paperId,
              paperName: paper.paperName,
              years: [{ year: year.year, questions: paperQuestions }]
            };
          }
        }
        return acc;
      },
      {}
    );
  }, [questions]);

  return (
    <MuuriGrid emptyMessage="No papers match your filters.">
      {Object.values(papers).map((paper) => (
        <PaperCard
          key={paper.paperId}
          paper={paper}
          currentYear={currentYear}
        />
      ))}
    </MuuriGrid>
  );
};

const QuestionsGridSkeleton = () => (
  <div className="flex flex-wrap gap-2 p-1">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton
        key={`skeleton-${i}`}
        className="h-40"
        style={{ width: `${90 + (i % 4) * 20}px` }}
      />
    ))}
  </div>
);

export const QuestionsGrid = () => {
  return (
    <ErrorBoundary
      fallback={
        <ErrorMessage
          title="Failed to load questions"
          description="Please refresh the page."
        />
      }
    >
      <Suspense fallback={<QuestionsGridSkeleton />}>
        <QuestionsGridInner />
      </Suspense>
    </ErrorBoundary>
  );
};
