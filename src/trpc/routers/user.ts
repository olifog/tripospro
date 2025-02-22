import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { usersTable, userSettingsTable } from "@/db/schema/user";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const [userSettings] = await Promise.all([
      db.query.userSettingsTable.findFirst({
        with: {
          user: true,
        },
        where: eq(usersTable.clerkId, ctx.userId),
      }),
    ]);
    return userSettings;
  }),
  updateUserSettings: protectedProcedure.input(z.object({
    triposPartId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, ctx.userId),
    });

    if (!user) throw new Error("User not found");

    await db.update(userSettingsTable)
      .set({
        triposPartId: input.triposPartId,
      })
      .where(eq(userSettingsTable.userId, user.id));

    return { success: true };
  }),
});
