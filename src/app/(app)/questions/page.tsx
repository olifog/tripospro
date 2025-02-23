import { PageLayout } from "@/components/layout/page-layout";
import { getPart } from "@/lib/search-params";
import { withParamsCache } from "@/lib/with-params-cache";

function QuestionsPage() {
  const part = getPart();

  return (
    <PageLayout header={<h1>Questions</h1>}>
      <div>Questions</div>
      <div>{part}</div>
    </PageLayout>
  )
}

export default withParamsCache(QuestionsPage);
