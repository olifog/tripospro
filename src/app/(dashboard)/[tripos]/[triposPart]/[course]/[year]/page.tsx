import { Badge } from "@/components/ui/badge";
import {
  academicYearToReadable,
  triposPartToReadable,
  yearToAcademicYear,
} from "@/lib/utils";
import { getCourseYearByPath } from "@/queries/courseYear";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

export default async function CourseYear({
  params,
}: {
  params: { tripos: string; triposPart: string; course: string; year: string };
}) {
  const courseYear = await getCourseYearByPath(params);

  if (courseYear === null) return notFound();

  const {
    courseYearUrl,
    course: { name: courseName },
    description,
    lectures,
    suggestedSupervisions,
    easter,
    lent,
    michaelmas,
    CourseYearLecturer,
  } = courseYear;

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mb-12">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold">
          {triposPartToReadable(params.triposPart)} {courseName}{" "}
          {academicYearToReadable(yearToAcademicYear(params.year))}
        </h1>
        <div className="flex space-x-2">
          {michaelmas && <Badge>Michaelmas</Badge>}
          {lent && <Badge>Lent</Badge>}
          {easter && <Badge>Easter</Badge>}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {lectures}
            </span>{" "}
            lectures,{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {suggestedSupervisions}
            </span>{" "}
            supervisions
          </p>
        </div>
        <div className="flex space-x-2 items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Lectured by:
          </span>
          <div className="flex items-center">
            {CourseYearLecturer.map(({ lecturer }, index) => (
              <Fragment key={lecturer.id}>
                <Link
                  href={`/profile/${lecturer.crsid}`}
                  className="hover:underline text-blue-500 text-sm"
                >
                  {lecturer.name ?? lecturer.crsid}
                </Link>
                {index < CourseYearLecturer.length - 1 && (
                  <span className="text-sm pr-2 text-slate-500 dark:text-slate-400">
                    ,
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        </div>
        <Link
          href={courseYearUrl}
          className="text-sm text-slate-500 dark:text-slate-400 flex items-end hover:underline"
        >
          <span>Course Page</span>
          <ArrowUpRight className="w-4 h-4 mb-[1px]" />
        </Link>
      </div>
      <div
        className="prose-sm max-w-xl prose-slate prose-ul:list-disc prose-li:my-0 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}
