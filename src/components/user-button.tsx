"use client";

import { UserButton as ClerkUserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function UserButton(props: {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { resolvedTheme } = useTheme();
  const sizeClass =
    props.size === "sm"
      ? "size-5!"
      : props.size === "md"
        ? "size-6!"
        : "size-7!";

  return (
    <ClerkUserButton
      showName={props.showName}
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        elements: {
          rootBox: "flex-1",
          userButtonAvatarBox: sizeClass,
          userButtonTrigger: "w-full flex-1 justify-start!",
          userButtonBox: "flex-row-reverse!"
        }
      }}
      fallback={
        <Skeleton
          className={cn("rounded-full", sizeClass, props.showName && "w-full!")}
        />
      }
    />
  );
}
