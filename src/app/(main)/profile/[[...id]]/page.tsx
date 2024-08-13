import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, getUser } from "@/queries/user";
import { notFound, redirect } from "next/navigation";

export default async function Profile({
  params,
}: {
  params: { id?: string[] };
}) {
  const signedInUser = await getCurrentUser();

  if (!signedInUser && (!params.id || params.id.length === 0))
    return redirect("/");

  const user =
    !params.id || params.id.length === 0
      ? signedInUser
      : await getUser(params.id[0]);

  if (!user) return notFound();

  return (
    <div>
      <div className="flex space-x-2 items-center">
        <h1 className="text-3xl">{user.crsid}</h1>
        {user.admin && <Badge variant="secondary">Admin</Badge>}
      </div>
      Profile page for user {user?.ravenId}
    </div>
  );
}
