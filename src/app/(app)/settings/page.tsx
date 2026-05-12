import { PageLayout } from "@/components/layout/page-layout";
import { ModeToggle } from "@/components/mode-toggle";
import { Label } from "@/components/ui/label";
import { withParamsCache } from "@/lib/with-params-cache";

function SettingsPage() {
  return (
    <PageLayout header={<h1>Settings</h1>}>
      <div className="flex max-w-md flex-col gap-4 p-2">
        <div className="flex items-center justify-between">
          <Label>Theme</Label>
          <ModeToggle />
        </div>
      </div>
    </PageLayout>
  );
}

export default withParamsCache(SettingsPage);
