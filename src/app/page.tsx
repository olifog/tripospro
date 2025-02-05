import { trpc } from "@/trpc/server";
import { UserButton } from "@/components/user-button";
import { SignInButton } from "@clerk/nextjs";
export default async function Home() {
  const data = await trpc.hello({ text: "client" });

  return (
    <div>
      <h1>Hello World</h1>
      <p>{data?.greeting}</p>
      <UserButton />
      <SignInButton />
    </div>
  );
}
