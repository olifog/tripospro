import posthog from "posthog-js";

if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development"
  });
}
