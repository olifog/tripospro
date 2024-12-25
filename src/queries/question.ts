import { prisma } from "@/lib/prisma";
import { getCourseYearByPath } from "./courseYear";

export const getCourseYearQuestions = async (courseYearId: number) => {
  const data = await prisma.question.findMany({
    where: {
      courseYearId,
    },
  });

  return data;
};

export const getQuestionByPath = async ({
  tripos,
  triposPart,
  course,
  year,
  questionNumber,
}: {
  tripos: string;
  triposPart: string;
  course: string;
  year: string;
  questionNumber: string;
}) => {
  const courseYear = await getCourseYearByPath({
    tripos,
    course,
    year,
  });

  const data = await prisma.question.findFirst({
    where: {
      courseYearId: courseYear?.id,
      questionNumber: parseInt(questionNumber),
    },
  });

  if (data) {
    return {
      ...data,
      courseYear,
    };
  }

  return null;
};

export const getQuestionAnswers = async ({
  questionId,
  userId,
}: {
  questionId: number;
  userId: string;
}) => {
  const data = await prisma.userQuestionAnswer.findMany({
    where: {
      questionId,
      userId,
    },
  });

  return data;
};

export const getQuestionWithContextById = async ({
  questionId,
}: {
  questionId: number;
}) => {
  const data = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      courseYear: {
        include: {
          TriposPartYear: {
            include: {
              triposPart: {
                include: {
                  tripos: true,
                },
              },
            },
          },
          course: true,
        },
      },
      paperYear: {
        include: {
          paper: true,
        },
      },
    },
  });

  return data;
};
