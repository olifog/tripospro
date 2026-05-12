"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const FALLBACK_ROUTE = "/questions";

function canGoBack(): boolean {
  const nav = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  if (nav && typeof nav.canGoBack === "boolean") {
    return nav.canGoBack;
  }
  return false;
}

export const BackButton = () => {
  const router = useRouter();

  const handleBack = () => {
    if (canGoBack()) {
      router.back();
    } else {
      router.push(FALLBACK_ROUTE);
    }
  };

  return (
    <Button onClick={handleBack} variant="ghost">
      <ArrowLeft className="h-6 w-6" />
      Back
    </Button>
  );
};
