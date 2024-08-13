"use server";

import { prisma } from "@/lib/prisma";

export const editUser = async (id: string, data: any) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};
