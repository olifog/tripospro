"use client";

import { trpc } from "@/trpc/client";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorMessage } from "../error";
import { Skeleton } from "../ui/skeleton";

export const ProfilePicture = ({ crsid }: { crsid: string }) => {
  return (
    <ErrorBoundary fallback={<ProfilePictureError />}>
      <Suspense fallback={<ProfilePictureSkeleton />}>
        <ProfilePictureInner crsid={crsid} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ProfilePictureError = () => {
  return (
    <div className="flex h-16 w-16 items-center justify-center">
      <ErrorMessage
        variant="compact"
        title="Failed to load profile picture"
        description="Please refresh the page."
      />
    </div>
  );
};

const ProfilePictureSkeleton = () => {
  return <Skeleton className="h-16 w-16 rounded-lg" />;
};

const ProfilePictureInner = ({ crsid }: { crsid: string }) => {
  const [userData] = trpc.user.getUserByCrsid.useSuspenseQuery({ crsid });

  if (!userData?.clerkUser?.imageUrl)
    return <ProfilePictureDefault crsid={crsid} />;

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-lg">
      <Image
        src={userData?.clerkUser?.imageUrl}
        alt={crsid}
        fill
        className="object-cover"
      />
    </div>
  );
};

const ProfilePictureDefault = ({ crsid }: { crsid: string }) => {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
      <span className="text-gray-500">{crsid.slice(0, 2)}</span>
    </div>
  );
};

export const ProfileDetails = ({ crsid }: { crsid: string }) => {
  return (
    <ErrorBoundary fallback={<ProfileDetailsError />}>
      <Suspense fallback={<ProfileDetailsSkeleton />}>
        <ProfileDetailsInner crsid={crsid} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ProfileDetailsSkeleton = () => {
  return <Skeleton className="h-4 w-24" />;
};

const ProfileDetailsError = () => {
  return (
    <ErrorMessage
      variant="compact"
      title="Failed to load profile details"
      description="Please refresh the page."
    />
  );
};

const ProfileDetailsInner = ({ crsid }: { crsid: string }) => {
  const [userData] = trpc.user.getUserByCrsid.useSuspenseQuery({ crsid });

  return (
    <span className="text-muted-foreground">
      {userData?.clerkUser?.firstName} {userData?.clerkUser?.lastName}
    </span>
  );
};
