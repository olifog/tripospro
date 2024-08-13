"use client";

import { logout } from "@/lib/logout";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRecoilState } from "recoil";

export const SignOutButton = () => {
  return (
    <DropdownMenuItem
      onClick={async () => {
        await logout();
      }}
    >
      Sign out
    </DropdownMenuItem>
  );
};
