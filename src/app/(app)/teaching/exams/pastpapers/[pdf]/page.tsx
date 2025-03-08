import { notFound, redirect } from "next/navigation";

export default async function PastPaperPage({
  params
}: {
  params: Promise<{ pdf: string }>;
}) {
  const { pdf } = await params;

  // pdf is of the form y2014p6q4.pdf
  // we need to extract the year, paper number, question number with a regex

  const matcher = /y(\d{4})p(\d+)q(\d+)\.pdf/;
  const match = pdf.match(matcher);

  if (!match) {
    return <div>Invalid PDF name</div>;
  }

  const year = match[1];
  const paperNumber = match[2];
  const questionNumber = match[3];

  if (!year || !paperNumber || !questionNumber) {
    return notFound();
  }

  return redirect(`/p/${paperNumber}/${year}/${questionNumber}`);
}
