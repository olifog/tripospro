import { PageLayout } from "@/components/layout/page-layout";
import { Link } from "@/components/link/server";
import { getPart } from "@/lib/search-params";
import { withParamsCache } from "@/lib/with-params-cache";

function QuestionsPage() {
  const part = getPart();

  return (
    <PageLayout header={<h1>Questions</h1>}>
      <div>Questions</div>
      <div>{part}</div>
      <Link href="/p/1/2022/1">Question 1</Link>
    </PageLayout>
  );
}

export default withParamsCache(QuestionsPage);
