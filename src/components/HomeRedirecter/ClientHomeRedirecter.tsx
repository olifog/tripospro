"use client";

import { getCurrentUser } from "@/queries/user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const ClientHomeRedirecter = ({
  user,
}: {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) => {
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.tripos || !user.triposPart) return;
    router.replace(`/${user.tripos.code}/${user.triposPart.name}`);
  }, []);

  return null;
};
