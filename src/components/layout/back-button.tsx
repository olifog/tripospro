"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const BackButton = () => {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} variant="ghost">
      <ArrowLeft className="h-6 w-6" />
      Back
    </Button>
  );
};
