import { setDefaultAutoSelectFamily } from "node:net";

// goofy temp fix
setDefaultAutoSelectFamily(false);

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";

import * as courseSchema from "./schema/course";
import * as paperSchema from "./schema/paper";
import * as questionSchema from "./schema/question";
import * as triposSchema from "./schema/tripos";
import * as userSchema from "./schema/user";

const schema = {
  ...courseSchema,
  ...paperSchema,
  ...questionSchema,
  ...userSchema,
  ...triposSchema
};

const sql = neon(env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
