import { HydrateClient } from "@/trpc/server";
import { ProfileDetails, ProfilePicture } from "./profile-content-client";

const TopProfile = ({ crsid }: { crsid: string }) => {
  return (
    <div className="flex gap-4">
      <HydrateClient>
        <ProfilePicture crsid={crsid} />
      </HydrateClient>
      <div className="flex flex-col ">
        <h1 className="font-bold text-xl">{crsid}</h1>
        <HydrateClient>
          <ProfileDetails crsid={crsid} />
        </HydrateClient>
      </div>
    </div>
  )
}

export async function ProfileContent({ crsid }: { crsid: string }) {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <TopProfile crsid={crsid} />
    </div>
  )
}
