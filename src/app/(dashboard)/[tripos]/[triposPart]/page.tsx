import { CourseCardWithSuspense } from "@/components/CourseCard";
import { CourseFilterProvider } from "@/components/CourseFilter/CourseFilterProvider";
import { getTriposPartCourses } from "@/queries/course";
import { getAllTriposes } from "@/queries/tripos";
import { getTriposParts } from "@/queries/triposPart";
import { notFound } from "next/navigation";

export default async function TriposPart({
  params,
}: {
  params: { tripos: string; triposPart: string };
}) {
  const triposes = await getAllTriposes();
  const triposObject = triposes.find((tripos) => tripos.code === params.tripos);

  if (!triposObject) return notFound();

  const triposParts = await getTriposParts(triposObject.id);
  const triposPartObject = triposParts.find(
    (triposPart) => triposPart.name === params.triposPart
  );

  if (!triposPartObject) return notFound();

  const courses = await getTriposPartCourses(triposPartObject.id);

  return (
    <div className="flex flex-col w-full max-w-4xl items-center">
      <CourseFilterProvider>
        <div className="flex flex-wrap gap-2 w-full">
          {courses.map((course) => (
            <CourseCardWithSuspense
              key={course.id}
              name={course.code}
              courseId={course.id}
              tripos={params.tripos}
              triposPart={params.triposPart}
            />
          ))}
        </div>
      </CourseFilterProvider>
    </div>
  );
}
