"use client";

import { getAllTriposes } from "@/queries/tripos";
import { troute } from "@/troute";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import Link from "next/link";
import { LinkCombobox } from "./LinkCombobox";
import { Skeleton } from "../ui/skeleton";

export const ClientViewBreadcrumb = ({
  triposes,
}: {
  triposes: Awaited<ReturnType<typeof getAllTriposes>>;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const selectedTriposCode = pathname.split("/")[1];
  const selectedTriposPartName = pathname.split("/")[2];
  const selectedCourseCode = pathname.split("/")[3];
  const selectedYear = pathname.split("/")[4];
  const selectedQuestionNumber = pathname.split("/")[5];

  const selectedTripos = triposes.find(
    (tripos) => tripos.code === selectedTriposCode
  );

  const { data: triposParts, isLoading: triposPartsLoading } =
    troute.getTriposParts({
      params: selectedTripos?.id,
      enabled: !!selectedTripos,
    });
  const selectedTriposPart = triposParts?.find(
    (triposPart) => triposPart.name === selectedTriposPartName
  );

  const { data: courses, isLoading: coursesLoading } =
    troute.getTriposPartCourses({
      params: selectedTriposPart?.id,
      enabled: !!selectedTriposPart,
    });
  const selectedCourse = courses?.find(
    (course) => course.code === selectedCourseCode
  );

  const { data: courseYears, isLoading: courseYearsLoading } =
    troute.getCourseYears({
      params: selectedCourse?.id,
      enabled: !!selectedCourse,
    });
  const selectedCourseYear = courseYears?.find(
    (courseYear) => courseYear.year === selectedYear
  );

  const { data: questions, isLoading: questionsLoading } =
    troute.getCourseYearQuestions({
      params: selectedCourseYear?.id,
      enabled: !!selectedCourseYear,
    });
  const selectedQuestion = questions?.find(
    (question) => question.questionNumber === parseInt(selectedQuestionNumber)
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <LinkCombobox
            options={triposes.map((tripos) => ({
              value: tripos.id.toString(),
              label: tripos.code,
              link: `/${tripos.code}`,
            }))}
            defaultText="Tripos..."
            startingValue={selectedTripos?.id.toString()}
            isFinalBreadcrumb={!selectedTriposPart}
          />
        </BreadcrumbItem>
        {(triposPartsLoading || triposParts) && <BreadcrumbSeparator />}
        {triposPartsLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          triposParts && (
            <BreadcrumbItem>
              <LinkCombobox
                options={triposParts.map((triposPart) => ({
                  value: triposPart.id.toString(),
                  label: triposPart.name,
                  link: `/${selectedTriposCode}/${triposPart.name}`,
                }))}
                defaultText="Part..."
                startingValue={selectedTriposPart?.id.toString()}
                isFinalBreadcrumb={!selectedCourse}
              />
            </BreadcrumbItem>
          )
        )}
        {(coursesLoading || courses) && <BreadcrumbSeparator />}
        {coursesLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          courses && (
            <BreadcrumbItem>
              <LinkCombobox
                options={courses.map((course) => ({
                  value: course.id.toString(),
                  label: course.code,
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${course.code}`,
                }))}
                defaultText="Course..."
                startingValue={selectedCourse?.id.toString()}
                isFinalBreadcrumb={!selectedCourseYear}
              />
            </BreadcrumbItem>
          )
        )}
        {(courseYearsLoading || courseYears) && <BreadcrumbSeparator />}
        {courseYearsLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          courseYears && (
            <BreadcrumbItem>
              <LinkCombobox
                options={courseYears.map((courseYear) => ({
                  value: courseYear.id.toString(),
                  label: courseYear.year.toString(),
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${selectedCourseCode}/${courseYear.year}`,
                }))}
                defaultText="Year..."
                startingValue={selectedCourseYear?.id.toString()}
                isFinalBreadcrumb={!selectedQuestion}
              />
            </BreadcrumbItem>
          )
        )}
        {(questionsLoading || questions) && <BreadcrumbSeparator />}
        {questionsLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          questions && (
            <BreadcrumbItem>
              <LinkCombobox
                options={questions.map((question) => ({
                  value: question.id.toString(),
                  label: question.questionNumber.toString(),
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${selectedCourseCode}/${selectedYear}/${question.questionNumber}`,
                }))}
                defaultText="Question..."
                startingValue={selectedQuestion?.id.toString()}
              />
            </BreadcrumbItem>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
