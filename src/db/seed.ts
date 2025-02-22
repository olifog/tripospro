import 'dotenv/config'
import { db } from '@/db'
import { triposPartTable, triposTable } from './schema'


export async function seed() {
  const [tripos] = await db.insert(triposTable).values({
    name: "Computer Science",
    code: "CST"
  }).returning()

  await db.insert(triposPartTable).values({
    name: "Part IA",
    code: "IA",
    triposId: tripos.id
  })

  await db.insert(triposPartTable).values({
    name: "Part IB",
    code: "IB",
    triposId: tripos.id
  })

  await db.insert(triposPartTable).values({
    name: "Part II",
    code: "II",
    triposId: tripos.id
  })

  console.log("Tripos seeded")
}

seed()
