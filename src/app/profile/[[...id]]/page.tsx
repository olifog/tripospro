import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function Profile({ params }: { params: { id?: string[] } }) {
  const { user: signedInUser } = await validateRequest();

  if (!signedInUser && (!params.id || params.id.length === 0)) return redirect("/");

  const user = await prisma.user.findUnique({
    where: {
      id: (!params.id || params.id.length === 0) ? signedInUser?.id : params.id[0],
    },
    include: {
      tripos: true,
      triposPart: true,
    }
  })

  if (!user) return notFound();

  return (
    <div>
      Profile page for user {user?.ravenId}
    </div>
  );
}
