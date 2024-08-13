export default async function CourseYear({
  params,
}: {
  params: { tripos: string; triposPart: string; course: string; year: string };
}) {
  return (
    <div>
      <h1>
        {params.tripos} {params.triposPart} {params.course} {params.year}
      </h1>
    </div>
  );
}
