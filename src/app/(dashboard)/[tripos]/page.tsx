import { triposPartToReadable } from "@/lib/utils";
import { getAllTriposes } from "@/queries/tripos";
import { getTriposParts } from "@/queries/triposPart";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Tripos({
  params,
}: {
  params: { tripos: string };
}) {
  const triposes = await getAllTriposes();
  const tripos = triposes.find((tripos) => tripos.code === params.tripos);

  if (!tripos) return notFound();

  const triposParts = await getTriposParts(tripos.id);

  return (
    <div className="flex flex-col space-y-4 items-center">
      <h1 className="text-2xl font-bold">{tripos.name}</h1>
      <p className="">
        Select a Part to see courses and questions.
      </p>
      <div className="flex flex-col space-y-4">
        {triposParts.map((triposPart) => (
          <Link href={`/${tripos.code}/${triposPart.name}`}>
            <div className="dark:bg-slate-800 bg-slate-700 border dark:border-slate-700 border-slate-600 rounded-md shadow-lg py-1 px-2 min-w-48 text-center hover:bg-slate-600 hover:dark:bg-slate-700 text-slate-100">
              Part{" "}
              <span className="font-semibold text-slate-50">
                {triposPartToReadable(triposPart.name)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
