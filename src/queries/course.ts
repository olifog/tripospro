import { prisma } from "@/lib/prisma";

export async function getTriposPartCourses(triposPartId: number) {
  const data = await prisma.course.findMany({
    where: {
      triposPartId: triposPartId,
    },
  });

  return data;
}

export const getCourse = async (courseId: number, userId?: string) => {
  const data = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      CourseYear: {
        include: {
          Question: {
            include: {
              _count: {
                select: {
                  UserQuestionAnswer: {
                    where: {
                      userId,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Next.js isn't doing branch detection correctly during webpack step
  const { unzipSync } = await import("next/dist/compiled/browserify-zlib");

  if (data) {
    return {
      ...data,
      CourseYear: data.CourseYear.map((courseYear) => ({
        ...courseYear,
        description: unzipSync(courseYear.description).toString(),
      })),
    };
  }

  return null;
};

export const getCourseByPath = async ({
  tripos,
  triposPart,
  course,
}: {
  tripos: string;
  triposPart: string;
  course: string;
}) => {
  const data = await prisma.course.findFirst({
    where: {
      code: course,
      triposPart: {
        name: triposPart,
        tripos: {
          code: tripos,
        },
      },
    },
    include: {
      CourseYear: true,
    },
  });

  return data;
};
