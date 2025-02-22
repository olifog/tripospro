import { baseProcedure } from "../init";
import { createTRPCRouter } from "../init";
import { db } from "@/db";
import { userSettingsTable, usersTable } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export const triposRouter = createTRPCRouter({
  getTriposParts: baseProcedure.query(async ({ ctx, input }) => {
    const parts = await db.query.triposPartTable.findMany({});
    return parts;
  }),
  getTriposPartsWithUserSelected: baseProcedure.query(
    async ({ ctx, input }) => {
      const [parts, [{ user_settings: userSettings }]] = await Promise.all([
        db.query.triposPartTable.findMany({}),
        ctx.userId
          ? db
              .select()
              .from(userSettingsTable)
              .leftJoin(usersTable, eq(userSettingsTable.userId, usersTable.id))
              .where(eq(usersTable.clerkId, ctx.userId))
              .limit(1)
          : Promise.resolve([
              {
                user_settings: null,
              },
            ]),
      ]);
      return {
        parts,
        selectedPartId: userSettings?.triposPartId,
      };
    }
  ),
});
