"use client";

import { usePart, useQuestionsFilter } from "@/hooks/use-params";
import { defaultPartCode, defaultQuestionsFilter } from "@/lib/search-params";
import { trpc } from "@/trpc/client";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { MuuriGrid } from "../muuri-grid";
import { CourseCard, type CourseCardData } from "./course-card";
import { PaperCard, type PaperCardData } from "./paper-card";

const QuestionsGridInner = () => {
  const [part] = usePart();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });
  // const [{ view }] = useQuestionsFilter();

  return (
    <div className="relative w-full">
      <PaperGrid />
    </div>
  );

  // return (
  //   <div className="relative w-full">
  //     {view === "course" ? <CourseGrid /> : <PaperGrid />}
  //   </div>
  // );
};

const CourseGrid = () => {
  const [part] = usePart();
  const [{ search, yearCutoff, onlyCurrent }] = useQuestionsFilter();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });

  const currentYear = useMemo(() => {
    return questions.years.reduce((acc, year) => {
      return Math.max(acc, year.year);
    }, 0);
  }, [questions.years]);

  const courses = useMemo(
    () =>
      questions.years.reduce<Record<string, CourseCardData>>(
        (acc, year) => {
          if (year.year < (yearCutoff ?? defaultQuestionsFilter.yearCutoff))
            return acc;

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
                }[]
              >((acc, question) => {
                if (question.courseYearId === course.courseYearId) {
                  acc.push({
                    questionNumber: question.number,
                    paperName: paper.paperName!,
                    answers: question.answers
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
                  years: [
                    {
                      year: year.year,
                      questions: courseQuestions
                    }
                  ]
                };
              }
            }
          }
          return acc;
        },
        {} as Record<string, CourseCardData>
      ),
    [questions, yearCutoff]
  );

  const filteredCourses = onlyCurrent
    ? Object.values(courses).filter((course) =>
        course.years.some((year) => year.year === currentYear)
      )
    : Object.values(courses);
  const searchFilteredCourses = search
    ? filteredCourses.filter(
        (course) =>
          course.courseName.toLowerCase().includes(search.toLowerCase()) ||
          course.courseCode.toLowerCase().includes(search.toLowerCase())
      )
    : filteredCourses;

  return (
    <MuuriGrid>
      {searchFilteredCourses.map((course) => (
        <CourseCard key={course.courseId} course={course} />
      ))}
    </MuuriGrid>
  );
};

const PaperGrid = () => {
  const [part] = usePart();
  // const [{ search, yearCutoff, onlyCurrent }] = useQuestionsFilter();
  const [questions] = trpc.triposPart.getQuestions.useSuspenseQuery({
    part: part ?? defaultPartCode
  });

  const currentYear = useMemo(() => {
    return questions.years.reduce((acc, year) => {
      return Math.max(acc, year.year);
    }, 0);
  }, [questions.years]);

  const papers = useMemo(() => {
    return questions.years.reduce<Record<string, PaperCardData>>(
      (acc, year) => {
        for (const paper of year.papers) {
          if (!paper.paperName || paper.paperId === null) continue;

          const paperQuestions = paper.questions.map((question) => ({
            questionNumber: question.number,
            answers: question.answers
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
              years: [
                {
                  year: year.year,
                  questions: paperQuestions
                }
              ]
            };
          }
        }
        return acc;
      },
      {}
    );
  }, [JSON.stringify(questions)]);

  // const yearFilteredPapers = useMemo(() => {
  //   return Object.values(papers).reduce<Record<string, PaperCardData>>((acc, paper) => {
  //     const paperYears = paper.years.filter((year) => year.year >= (yearCutoff ?? defaultQuestionsFilter.yearCutoff));

  //     if (paperYears.length === 0) return acc;

  //     acc[paper.paperId] = {
  //       ...paper,
  //       years: paperYears
  //     };

  //     return acc;
  //   }, {});
  // }, [yearCutoff])

  // const onlyCurrentFilteredPapers = useMemo(() => {
  //   return onlyCurrent
  //     ? Object.values(yearFilteredPapers).filter((paper) =>
  //         paper.years.some((year) => year.year === currentYear)
  //       )
  //     : Object.values(yearFilteredPapers);
  // }, [yearFilteredPapers, currentYear, onlyCurrent]);

  // const searchFilteredPapers = useMemo(() => {
  //   return search
  //     ? onlyCurrentFilteredPapers.filter((paper) =>
  //         paper.paperName.toLowerCase().includes(search.toLowerCase())
  //       )
  //     : onlyCurrentFilteredPapers;
  // }, [onlyCurrentFilteredPapers, search]);

  return (
    <MuuriGrid>
      {Object.values(papers).map((paper) => (
        <PaperCard key={paper.paperId} paper={paper} />
      ))}
    </MuuriGrid>
  );
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
