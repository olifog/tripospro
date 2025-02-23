import { PageLayout } from "@/components/layout/page-layout";
import { ProfileContent } from "@/components/profile/profile-content";
import { withParamsCache } from "@/lib/with-params-cache";
import { trpc } from "@/trpc/server";

async function ProfilePage({ params }: {
  params: Promise<{ [key: string]: string }>;
}) {
  const { crsid } = await params;

  trpc.user.getUserByCrsid.prefetch({ crsid });

  return (
    <PageLayout header={
      <h1>
        Profile for <span className="font-bold">{crsid}</span>
      </h1>
    }>
      <ProfileContent crsid={crsid} />
    </PageLayout>
  )
}

export default withParamsCache(ProfilePage);
