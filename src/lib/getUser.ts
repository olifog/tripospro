import { validateRequest } from "@/lib/auth";
import { prisma } from "./prisma";

export const getUser = async () => {
  const {user: signedInUser} = await validateRequest();

  if (!signedInUser) return null;

  return await prisma.user.findUnique({
    where: {
      id: signedInUser.id,
    },
    include: {
      tripos: true,
      triposPart: true,
    }
  })
}
