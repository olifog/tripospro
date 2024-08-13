import { getAllTriposes } from "@/queries/tripos";
import { notFound } from "next/navigation";

export default async function Tripos({
  params,
}: {
  params: { tripos: string };
}) {
  const triposes = await getAllTriposes();
  const tripos = triposes.find((tripos) => tripos.code === params.tripos);

  if (!tripos) return notFound();

  return (
    <div>
      This is the {tripos.name} tripos page! Select a Part to see questions.
    </div>
  );
}
