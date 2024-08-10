import { prisma } from "@/lib/prisma";

export const getAllTriposes = async () => {
  return await prisma.tripos.findMany();
};
