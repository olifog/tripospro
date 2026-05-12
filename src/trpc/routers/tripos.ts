import { baseProcedure, createTRPCRouter } from "../init";

export const triposRouter = createTRPCRouter({
  getTriposParts: baseProcedure.query(async ({ ctx }) => {
    return ctx.db.query.triposPartTable.findMany({});
  })
});
