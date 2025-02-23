import { PageLayout } from "@/components/layout/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsLoading() {
  return (
    <PageLayout header={
      <Skeleton className="h-10 w-24" />
    }>
      <Skeleton className="h-10 w-24" />
    </PageLayout>
  );
}
