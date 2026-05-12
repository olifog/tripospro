import { HydrateClient } from "@/trpc/server";
import { ProfileContentClient } from "./profile-content-client";

export async function ProfileContent({ crsid }: { crsid: string }) {
  return (
    <HydrateClient>
      <ProfileContentClient crsid={crsid} />
    </HydrateClient>
  );
}
