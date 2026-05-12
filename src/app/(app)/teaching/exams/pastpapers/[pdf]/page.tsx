import { notFound, redirect } from "next/navigation";

export default async function PastPaperPage({
  params
}: {
  params: Promise<{ pdf: string }>;
}) {
  const { pdf } = await params;

  const matcher = /y(\d{4})p(\d+)q(\d+)\.pdf/;
  const match = pdf.match(matcher);

  if (!match || !match[1] || !match[2] || !match[3]) {
    notFound();
  }

  const year = match[1];
  const paperNumber = match[2];
  const questionNumber = match[3];

  return redirect(`/p/${paperNumber}/${year}/${questionNumber}`);
}
