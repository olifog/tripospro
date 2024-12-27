"use server";

import { prisma } from "@/lib/prisma";

export const createAnswer = async ({
  questionId,
  userId,
}: {
  questionId: number;
  userId: string;
}) => {
  const data = await prisma.userQuestionAnswer.create({
    data: {
      questionId,
      userId,
    },
  });

  return data;
};

export const answerQuestion = async ({
  questionId,
  userId,
  timeTaken,
  marks,
}: {
  questionId: number;
  userId: string;
  timeTaken: number;
  marks: number;
}) => {
  const data = await prisma.userQuestionAnswer.create({
    data: {
      questionId,
      userId,
      timeTaken,
      marks,
    },
  });

  return data;
};
