"use client";

import { logout } from "@/lib/logout";
import { DropdownMenuItem } from "./ui/dropdown-menu";

export const SignOutButton = () => (
  <DropdownMenuItem onClick={async () => await logout()}>
    Sign out
  </DropdownMenuItem>
);
