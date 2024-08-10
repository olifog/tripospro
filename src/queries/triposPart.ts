import { prisma } from "@/lib/prisma";

export const getTriposParts = async (triposId: number) => {
  return await prisma.triposPart.findMany({
    where: {
      triposId,
    },
  });
};
