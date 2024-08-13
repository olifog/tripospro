"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export const BackButton = () => {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Button variant="outline" onClick={router.back}>
      <ArrowLeftIcon className="h-4 w-4 mr-2" />
      <span>Back</span>
    </Button>
  );
};
