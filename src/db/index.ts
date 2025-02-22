import { env } from "@/env";
import { drizzle } from "drizzle-orm/neon-http";

import * as userSchema from "./schema/user";

const schema = {
  ...userSchema
};

export const db = drizzle(env.DATABASE_URL, { schema: { ...schema } });
