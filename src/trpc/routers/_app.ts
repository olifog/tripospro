import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { courseRouter } from "./course";
import { questionRouter } from "./question";
import { triposRouter } from "./tripos";
import { triposPartRouter } from "./triposPart";
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
  question: questionRouter,
  triposPart: triposPartRouter,
  course: courseRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
