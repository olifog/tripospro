import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getUser = async (id?: string) => {
  const userId =
    id ||
    (await (async () => {
      const { user: signedInUser } = await validateRequest();
      return signedInUser?.id;
    })());

  if (!userId) return null;

  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      tripos: true,
      triposPart: true,
    },
  });
};

export const getCurrentUser = async () => await getUser();
