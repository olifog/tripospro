"use client";

import { usePart } from "@/hooks/use-params";
import NextLink from "next/link";
import { getHrefWithPart } from "./_shared";

export const useClientHref = () => {
  const [part] = usePart();

  return (href: string) => {
    return getHrefWithPart(href, part ?? "");
  };
};

export function Link({
  href,
  ...props
}: React.ComponentProps<typeof NextLink>) {
  const getHref = useClientHref();

  const hrefWithPart = typeof href === "string" ? getHref(href) : href;

  return <NextLink href={hrefWithPart} {...props} />;
}
