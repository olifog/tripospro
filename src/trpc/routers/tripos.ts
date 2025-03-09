import { baseProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const triposRouter = createTRPCRouter({
  getTriposParts: baseProcedure.query(async ({ ctx, input }) => {
    const parts = await ctx.db.query.triposPartTable.findMany({});
    return parts;
  })
});
