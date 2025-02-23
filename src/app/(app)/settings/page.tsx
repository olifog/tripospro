import { PageLayout } from "@/components/layout/page-layout";
import { ModeToggle } from "@/components/mode-toggle";
import { withParamsCache } from "@/lib/with-params-cache";

function SettingsPage() {
  return (
    <PageLayout header={<h1>Settings</h1>}>
      <div>Settings</div>
      <ModeToggle />
    </PageLayout>
  );
}

export default withParamsCache(SettingsPage);
