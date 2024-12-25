import { prisma } from "@/lib/prisma";

export const getCourseYears = async (courseId: number) => {
  const data = await prisma.courseYear.findMany({
    where: {
      courseId,
    },
  });

  // Next.js isn't doing branch detection correctly during webpack step
  const { unzipSync } = await import("next/dist/compiled/browserify-zlib");

  if (data) {
    return data.map((courseYear) => ({
      ...courseYear,
      description: unzipSync(courseYear.description).toString(),
    }));
  }

  return null;
};

export const getCourseYearByPath = async ({
  tripos,
  course,
  year,
}: {
  tripos: string;
  course: string;
  year: string;
}) => {
  const data = await prisma.courseYear.findFirst({
    where: {
      year,
      course: {
        code: course,
        tripos: {
          code: tripos
        }
      },
    },
    include: {
      course: true,
      CourseYearLecturer: {
        include: {
          lecturer: true,
        },
      },
    },
  });

  // Next.js isn't doing branch detection correctly during webpack step
  const { unzipSync } = await import("next/dist/compiled/browserify-zlib");

  if (data) {
    return {
      ...data,
      description: unzipSync(data.description).toString(),
    };
  }

  return null;
};

export const getCourseYearQuestions = async (
  courseYearId: number,
  userId?: string
) => {
  const data = await prisma.question.findMany({
    where: {
      courseYearId,
    },
    include: {
      _count: {
        select: {
          UserQuestionAnswer: {
            where: { userId: userId ?? "" },
          },
        },
      },
    },
  });

  return data;
};
