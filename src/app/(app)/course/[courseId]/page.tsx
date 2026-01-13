import { PageLayout } from "@/components/layout/page-layout";
import { CourseContent } from "@/components/course/course-content";
import { withParamsCache } from "@/lib/with-params-cache";
import { trpc } from "@/trpc/server";

export async function generateMetadata({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const courseIdNum = Number.parseInt(courseId, 10);

  try {
    const course = await trpc.course.getCourse({ courseId: courseIdNum });
    return {
      title: course.name
    };
  } catch {
    return {
      title: `Course #${courseId}`
    };
  }
}

async function CoursePage({
  params
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courseId } = await params;
  const courseIdNum = Number.parseInt(courseId, 10);

  trpc.course.getCourse.prefetch({ courseId: courseIdNum });

  return (
    <PageLayout header={<></>}>
      <CourseContent courseId={courseIdNum} />
    </PageLayout>
  );
}

export default withParamsCache(CoursePage);
