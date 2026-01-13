import { baseProcedure, createTRPCRouter } from "../init";

export const triposRouter = createTRPCRouter({
  getTriposParts: baseProcedure.query(async ({ ctx }) => {
    const parts = await ctx.db.query.triposPartTable.findMany({});
    return parts;
  })
});
