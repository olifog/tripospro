export default async function Question({
  params,
}: {
  params: {
    tripos: string;
    triposPart: string;
    course: string;
    year: string;
    questionNumber: string;
  };
}) {
  return (
    <div>
      <h1>
        {params.tripos} {params.triposPart} {params.course} {params.year}{" "}
        {params.questionNumber}
      </h1>
    </div>
  );
}
