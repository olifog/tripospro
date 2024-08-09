import { validateRequest } from "@/lib/auth";
import { getUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";

export default async function Home() {

  const triposes = await prisma.tripos.findMany()

  return (
    <div>
      <ul>
        {triposes.map(tripos => (
          <li key={tripos.id}>
            {tripos.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
