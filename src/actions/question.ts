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
