import { prisma } from "@/lib/prisma";

export const getCourseYears = async (courseId: number) => {
  const data = await prisma.courseYear.findMany({
    where: {
      courseId,
    },
  });

  return data;
};

export const getCourseYearByPath = async ({
  tripos,
  triposPart,
  course,
  year,
}: {
  tripos: string;
  triposPart: string;
  course: string;
  year: string;
}) => {
  const data = await prisma.courseYear.findFirst({
    where: {
      year,
      course: {
        code: course,
        triposPart: {
          name: triposPart,
          tripos: {
            code: tripos,
          },
        },
      },
    },
    include: {
      course: true,
    },
  });

  return data;
};
