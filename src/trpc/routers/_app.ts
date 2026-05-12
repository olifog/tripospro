import { createTRPCRouter } from "../init";
import { chatRouter } from "./chat";
import { courseRouter } from "./course";
import { questionRouter } from "./question";
import { triposRouter } from "./tripos";
import { triposPartRouter } from "./triposPart";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  tripos: triposRouter,
  user: userRouter,
  question: questionRouter,
  triposPart: triposPartRouter,
  course: courseRouter
});

export type AppRouter = typeof appRouter;
