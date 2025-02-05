import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { getAuth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)(async () => createTRPCContext({
  headers: new Headers({
    cookie: (await cookies()).toString(),
    "x-trpc-source": "rsc",
  }),
  auth: getAuth(
    new NextRequest("https://notused.com", { headers: await headers() }),
  ),
}));

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
);
