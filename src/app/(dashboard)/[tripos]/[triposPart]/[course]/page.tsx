import { CourseCardWithSuspense } from "@/components/CourseCard";
import { NoFilterProvider } from "@/components/CourseFilter/CourseFilterProvider";
import { triposPartToReadable } from "@/lib/utils";
import { getCourseByPath } from "@/queries/course";
import { notFound } from "next/navigation";

export default async function Course({
  params,
}: {
  params: { tripos: string; triposPart: string; course: string };
}) {
  const course = await getCourseByPath(params);

  if (!course) return notFound();

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mb-12 items-center">
      <h1 className="text-2xl font-bold">
        {triposPartToReadable(params.triposPart)} {course?.name}
      </h1>
      <div className="flex flex-col space-y-1 items-center">
        <div className="w-auto inline-block">
          <NoFilterProvider>
            <CourseCardWithSuspense
              courseId={course.id}
              tripos={params.tripos}
              triposPart={params.triposPart}
              name={course.name}
              absolute={false}
            />
          </NoFilterProvider>
        </div>
        <div className="flex flex-col space-y-1 text-sm text-slate-500 dark:text-slate-400">
          <p>
            This page is still under construction!
            <br />
            Planning to add:
          </p>
          <ul className="list-disc list-inside">
            <li>Question answer statistics over time</li>
            <li>Related/prerequisite courses</li>
            <li>Lecturers over time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
