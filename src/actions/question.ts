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
  difficulty,
}: {
  questionId: number;
  userId: string;
  timeTaken: number;
  difficulty: number;
}) => {
  const data = await prisma.userQuestionAnswer.create({
    data: {
      questionId,
      userId,
      timeTaken,
      difficulty,
    },
  });

  return data;
};
