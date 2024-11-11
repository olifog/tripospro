import { ProfilePage } from "@/components/ProfilePage";
import { getCurrentUser, getUserByCrsid } from "@/queries/user";
import { notFound, redirect } from "next/navigation";

export default async function Profile({
  params,
}: {
  params: { id?: string[] };
}) {
  const signedInUser = await getCurrentUser();

  if (params.id?.[0]) {
    const user = await getUserByCrsid(params.id[0]);
    if (!user) return notFound();
    return <ProfilePage user={user} />;
  }

  if (signedInUser) return redirect("/profile/" + signedInUser.crsid);

  return redirect("/");
}
