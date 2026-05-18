"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";
import { trpc } from "@/trpc/client";

function PostHogIdentifyInner() {
  const { userId } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: settings } = trpc.user.getUserSettings.useQuery(undefined, {
    enabled: !!userId
  });

  useEffect(() => {
    if (userId && user) {
      posthog.identify(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        crsid: user.primaryEmailAddress?.emailAddress?.split("@")[0]
      });
    } else if (!userId) {
      posthog.reset();
    }
  }, [userId, user]);

  useEffect(() => {
    if (userId && settings?.triposPartId) {
      posthog.group("tripos_part", settings.triposPartId.toString());
    }
  }, [userId, settings]);

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogIdentify() {
  return (
    <Suspense fallback={null}>
      <PostHogIdentifyInner />
    </Suspense>
  );
}
