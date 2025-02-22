import { env } from "@/env";
import { drizzle } from "drizzle-orm/neon-http";

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

export const db = drizzle(env.DATABASE_URL, { schema: { ...schema } });
