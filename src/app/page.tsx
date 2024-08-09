import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { logout } from "@/lib/logout";

export default async function Home() {
  const { user } = await validateRequest();

  return (
    <div>
      Main page
    </div>
  );
}
