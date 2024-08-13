export default async function Course({
  params,
}: {
  params: { tripos: string; triposPart: string; course: string };
}) {
  return (
    <div>
      <h1>
        {params.tripos} {params.triposPart} {params.course}
      </h1>
    </div>
  );
}
