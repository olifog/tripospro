import { HomeRedirecter } from "@/components/HomeRedirecter";
import { getAllTriposes } from "@/queries/tripos";
import Link from "next/link";

export default async function Home() {
  const triposes = await getAllTriposes();

  return (
    <div className="flex flex-col space-y-4 items-center">
      <div>Select a Tripos or sign in to start!</div>
      <HomeRedirecter />
      <div className="flex flex-col space-y-4 items-center">
        {triposes.map((tripos) => (
          <div className="dark:bg-slate-800 bg-slate-700 border dark:border-slate-700 border-slate-600 rounded-md shadow-lg py-1 px-2 min-w-48 text-center hover:bg-slate-600 hover:dark:bg-slate-700 text-slate-100">
            <Link href={`/${tripos.code}`}>{tripos.name}</Link>
          </div>
        ))}
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          More coming soon...
        </span>
      </div>
    </div>
  );
}
