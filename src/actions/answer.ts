"use server";

import { prisma } from "@/lib/prisma";

export const deleteAnswer = async (answerId: number) => {
  const data = await prisma.userQuestionAnswer.delete({
    where: {
      id: answerId,
    },
  });

  return data;
};
