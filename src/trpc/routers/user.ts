import type { User } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userSettingsTable, usersTable } from "@/db/schema/user";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

const filterClerkUser = (clerkUser: User) => {
  return {
    id: clerkUser.id,
    imageUrl: clerkUser.imageUrl,
    primaryEmailAddressId: clerkUser.primaryEmailAddressId,
    lastSignInAt: clerkUser.lastSignInAt,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses.map((email) => ({
      id: email.id,
      emailAddress: email.emailAddress
    })),
    publicMetadata: clerkUser.publicMetadata,
    lastActiveAt: clerkUser.lastActiveAt
  };
};

export const userRouter = createTRPCRouter({
  getUserByCrsid: baseProcedure
    .input(z.object({ crsid: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.crsid, input.crsid)
      });
      if (!user || !user.clerkId) throw new Error("User not found");
      const clerkUser = await ctx.clerkClient.users.getUser(user.clerkId);
      return {
        ...user,
        clerkUser: filterClerkUser(clerkUser)
      };
    }),
  getUserByClerkId: baseProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user, clerkUser] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, input.clerkId)
        }),
        ctx.clerkClient.users.getUser(input.clerkId)
      ]);
      return {
        ...user,
        clerkUser: filterClerkUser(clerkUser)
      };
    }),
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
