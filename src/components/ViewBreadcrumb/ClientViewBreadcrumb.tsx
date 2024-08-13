"use client";

import { getAllTriposes } from "@/queries/tripos";
import { troute } from "@/troute";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { LinkCombobox } from "./LinkCombobox";

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
          <LinkCombobox
            options={triposes.map((tripos) => ({
              value: tripos.id.toString(),
              label: tripos.code,
              link: `/${tripos.code}`,
            }))}
            defaultText="Tripos..."
            fallbackName={selectedTriposCode}
            startingValue={selectedTripos?.id.toString()}
            isFinalBreadcrumb={!selectedTriposPartName}
          />
        </BreadcrumbItem>
        {selectedTriposCode && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <LinkCombobox
                options={triposParts?.map((triposPart) => ({
                  value: triposPart.id.toString(),
                  label: triposPart.name,
                  link: `/${selectedTriposCode}/${triposPart.name}`,
                }))}
                defaultText="Part..."
                fallbackName={selectedTriposPartName}
                startingValue={selectedTriposPart?.id.toString()}
                isFinalBreadcrumb={!selectedCourseCode}
              />
            </BreadcrumbItem>
          </>
        )}
        {selectedTriposPartName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <LinkCombobox
                options={courses?.map((course) => ({
                  value: course.id.toString(),
                  label: course.code,
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${course.code}`,
                }))}
                defaultText="Course..."
                fallbackName={selectedCourseCode}
                startingValue={selectedCourse?.id.toString()}
                isFinalBreadcrumb={!selectedCourseYear}
              />
            </BreadcrumbItem>
          </>
        )}
        {selectedCourseCode && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <LinkCombobox
                options={courseYears?.map((courseYear) => ({
                  value: courseYear.id.toString(),
                  label: courseYear.year.toString(),
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${selectedCourseCode}/${courseYear.year}`,
                }))}
                defaultText="Year..."
                fallbackName={selectedYear}
                startingValue={selectedCourseYear?.id.toString()}
                isFinalBreadcrumb={!selectedQuestionNumber}
              />
            </BreadcrumbItem>
          </>
        )}
        {selectedYear && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <LinkCombobox
                options={questions?.map((question) => ({
                  value: question.id.toString(),
                  label: question.questionNumber.toString(),
                  link: `/${selectedTriposCode}/${selectedTriposPartName}/${selectedCourseCode}/${selectedYear}/${question.questionNumber}`,
                }))}
                defaultText="Question..."
                fallbackName={selectedQuestionNumber}
                startingValue={selectedQuestion?.id.toString()}
              />
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
