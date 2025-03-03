import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { questionRouter } from "./question";
import { triposRouter } from "./tripos";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string()
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`
      };
    }),
  tripos: triposRouter,
  user: userRouter,
  question: questionRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
