import { HomeRedirecter } from "@/components/HomeRedirecter";

export default async function Home() {
  return (
    <>
      <div>Select a Tripos or sign in to start!</div>
      <HomeRedirecter />
    </>
  );
}
