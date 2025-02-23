"use client";

import { usePart } from "@/hooks/use-params";
import NextLink from "next/link";
import { getHrefWithPart } from "./_shared";

export function Link({
  href,
  ...props
}: React.ComponentProps<typeof NextLink>) {
  const [part] = usePart();

  const hrefWithPart =
    typeof href === "string" ? getHrefWithPart(href, part ?? "") : href;

  return <NextLink href={hrefWithPart} {...props} />;
}
