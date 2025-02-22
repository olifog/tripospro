import { db } from "@/db";
import { userSettingsTable, usersTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const userRouter = createTRPCRouter({
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const [userSettings] = await Promise.all([
      db.query.userSettingsTable.findFirst({
        with: {
          user: true
        },
        where: eq(usersTable.clerkId, ctx.userId)
      })
    ]);
    return userSettings;
  }),
  updateUserSettings: protectedProcedure
    .input(
      z.object({
        triposPartId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, ctx.userId)
      });

      if (!user) throw new Error("User not found");

      await db
        .update(userSettingsTable)
        .set({
          triposPartId: input.triposPartId
        })
        .where(eq(userSettingsTable.userId, user.id));

      return { success: true };
    })
});
