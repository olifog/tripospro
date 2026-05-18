import { PostHog } from "posthog-node";
import { env } from "@/env";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST
    });
  }
  return posthogClient;
}
