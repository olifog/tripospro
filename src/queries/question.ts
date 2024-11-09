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
  const courseYear = await getCourseYearByPath({ tripos, triposPart, course, year });

  console.log(questionNumber)

  const question = await prisma.question.findFirst({
    where: {
      courseYearId: courseYear?.id,
      questionNumber: parseInt(questionNumber),
    },
  });

  return question;
};
