import { PageLayout } from "@/components/layout/page-layout";
import { Questions } from "@/components/questions";
import { LoadLocalFilters } from "@/components/questions/load-local-filters";
import { ViewOptions } from "@/components/questions/view-options";
import { defaultPartCode, getPart } from "@/lib/search-params";
import { withParamsCache } from "@/lib/with-params-cache";
import { trpc } from "@/trpc/server";

function QuestionsPage() {
  const part = getPart();
  trpc.triposPart.getQuestions.prefetch({ part: part ?? defaultPartCode });

  return (
    <PageLayout header={<h1>Questions</h1>}>
      <LoadLocalFilters />
      <ViewOptions />
      <Questions />
    </PageLayout>
  );
}

export default withParamsCache(QuestionsPage);
