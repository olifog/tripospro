import { getCourse } from "@/queries/course";
import { getCurrentUserId } from "@/queries/user";
import { Skeleton } from "./ui/skeleton";
import { Suspense } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const CourseCard = async ({
  courseId,
  tripos,
  triposPart,
}: {
  courseId: number;
  tripos: string;
  triposPart: string;
}) => {
  const userId = await getCurrentUserId();
  const course = await getCourse(courseId, userId);

  if (!course) return <div>Course not found.</div>;

  const questions = Array.from(
    course.CourseYear.reduce<Set<number>>((acc, year) => {
      for (const question of year.Question) {
        acc.add(question.id);
      }
      return acc;
    }, new Set())
  ).sort((a, b) => a - b);

  const years = course.CourseYear.map((year) => year.year);

  return (
    <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-md py-1 px-2 min-h-32 min-w-32 dark:bg-slate-950 dark:border-slate-800">
      <div className="flex w-full h-6">
        <TooltipProvider>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Link href={`/${tripos}/${triposPart}/${course.code}`}>
                <h1 className="hover:text-slate-300 text-white font-extrabold">
                  {course.code}
                </h1>
              </Link>
            </TooltipTrigger>
            <TooltipContent sideOffset={9} className="">
              <p className="text-base">{course.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex space-x-1">
        <div className="flex flex-col pt-[44px] space-y-1 mr-1">
          {questions.map((question) => (
            <span
              className="w-4 h-5 flex justify-end items-center text-sm text-white hover:text-slate-300"
              key={question}
            >
              {question}
            </span>
          ))}
        </div>
        {years.map((year) => (
          <div key={year} className="flex flex-col space-y-1">
            <div className="relative w-5 h-10">
              <Link href={`/${tripos}/${triposPart}/${course.code}/${year}`}>
                <span className="absolute -rotate-90 -left-1.5 top-3 text-sm text-slate-200 hover:text-slate-400">
                  {year}
                </span>
              </Link>
            </div>
            {questions.map((questionNumber) => {
              const questionYear = course.CourseYear.find(
                (courseYear) => courseYear.year === year
              );
              if (!questionYear)
                return <div key={questionNumber} className="w-5 h-5"></div>;

              const question = questionYear.Question.find(
                (question) => question.questionNumber === questionNumber
              );
              if (!question)
                return <div key={questionNumber} className="w-5 h-5"></div>;

              return (
                <Link
                  key={questionNumber}
                  href={`/${tripos}/${triposPart}/${course.code}/${year}/${question.questionNumber}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md ${
                      question._count.UserQuestionAnswer > 0
                        ? "bg-green-700"
                        : "bg-slate-600 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600"
                    }`}
                  ></div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CourseCardWithSuspense = ({
  courseId,
  tripos,
  triposPart,
  name,
}: {
  courseId: number;
  tripos: string;
  triposPart: string;
  name: string;
}) => {
  return (
    <Suspense
      fallback={
        <Skeleton className="w-32 h-32 rounded-md">
          <h1 className="dark:text-white mt-1 ml-2">{name}</h1>
        </Skeleton>
      }
    >
      <CourseCard courseId={courseId} tripos={tripos} triposPart={triposPart} />
    </Suspense>
  );
};