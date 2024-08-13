import { prisma } from "@/lib/prisma";

export const getCourseYearQuestions = async (courseYearId: number) => {
  const data = await prisma.question.findMany({
    where: {
      courseYearId,
    },
  });

  return data;
};
