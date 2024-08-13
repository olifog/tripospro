import { prisma } from "@/lib/prisma";

export const getCourseYears = async (courseId: number) => {
  const data = await prisma.courseYear.findMany({
    where: {
      courseId,
    },
  });

  return data;
};
