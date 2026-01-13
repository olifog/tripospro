import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { triposPartTable, triposTable } from "@/db/schema/tripos";

export async function seed() {
  // Check if Computer Science tripos already exists
  let tripos = await db.query.triposTable.findFirst({
    where: eq(triposTable.code, "CST")
  });

  if (!tripos) {
    [tripos] = await db
      .insert(triposTable)
      .values({
        name: "Computer Science",
        code: "CST"
      })
      .returning();
    console.log("Created Computer Science tripos");
  }

  // Define the parts to ensure exist
  const parts = [
    { name: "IA", code: "1a" },
    { name: "IB", code: "1b" },
    { name: "II", code: "2" }
  ];

  // Check and insert each part if it doesn't exist
  for (const part of parts) {
    const existingPart = await db.query.triposPartTable.findFirst({
      where: eq(triposPartTable.code, part.code)
    });

    if (!existingPart) {
      await db.insert(triposPartTable).values({
        name: part.name,
        code: part.code,
        triposId: tripos.id
      });
      console.log(`Created ${part.name} part`);
    }
  }

  console.log("Seed completed");
}
