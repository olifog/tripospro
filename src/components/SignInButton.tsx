"use client";

import { useState } from "react";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export const SignInButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
  };

  return (
    <Link
      href="/login/raven"
      onClick={handleSignIn}
      className={cn(
        buttonVariants({ variant: isLoading ? "secondary" : "default" }),
        isLoading && "cursor-not-allowed pointer-events-none"
      )}
    >
      {isLoading ? (
        <>
          <ReloadIcon className="animate-spin mr-1 h-4 w-4" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Link>
  );
};
