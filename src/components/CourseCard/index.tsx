import { getCourse } from "@/queries/course";
import { getCurrentUserId } from "@/queries/user";
import { Skeleton } from "../ui/skeleton";
import { Suspense } from "react";
import { ClientCourseCard } from "./CourseCard";

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
        acc.add(question.questionNumber);
      }
      return acc;
    }, new Set())
  ).sort((a, b) => a - b);

  const years = course.CourseYear.map((year) => year.year).sort(
    (a, b) => parseInt(b) - parseInt(a)
  )

  return (
    <ClientCourseCard
      course={course}
      tripos={tripos}
      triposPart={triposPart}
      questions={questions}
      years={years}
    />
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
