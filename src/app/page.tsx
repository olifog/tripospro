import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { logout } from "@/lib/logout";

export default async function Home() {
  const { user } = await validateRequest();

  return (
    <div>
      {user ? (
        <>
          <h1>Hi, {user.ravenId}!</h1>
          <form action={logout}>
            <button type="submit">Logout</button>
          </form>
        </>
      ) : (
        <>
          <form
            action={async () => {
              "use server";
              redirect("/login/raven");
            }}
          >
            <button type="submit">Login</button>
          </form>
        </>
      )}
    </div>
  );
}
