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
                  UserQuestionAnswer: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                      }
                    : true,
                },
              },
            },
          },
        },
      },
    },
  });

  return data;
};
