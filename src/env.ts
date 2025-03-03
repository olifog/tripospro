import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    VERCEL_URL: z.string().optional(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_SIGNING_SECRET: z.string(),
    OPENAI_API_KEY: z.string(),
    LLAMA_CLOUD_API_KEY: z.string()
  },

  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string()
  },

  shared: {
    NODE_ENV: z.enum(["development", "production"]).default("development")
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_SIGNING_SECRET: process.env.CLERK_SIGNING_SECRET,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LLAMA_CLOUD_API_KEY: process.env.LLAMA_CLOUD_API_KEY
  }
});
