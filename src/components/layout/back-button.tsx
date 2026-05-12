"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const BackButton = () => {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/questions");
    }
  };

  return (
    <Button onClick={handleBack} variant="ghost">
      <ArrowLeft className="h-6 w-6" />
      Back
    </Button>
  );
};
