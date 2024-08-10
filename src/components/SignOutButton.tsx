"use client";

import { logout } from "@/lib/logout";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRecoilState } from "recoil";
import { viewState } from "@/atoms/view";

export const SignOutButton = () => {
  const [_, setView] = useRecoilState(viewState);

  return (
    <DropdownMenuItem onClick={async () => {
      setView(view => ({...view, autoSelected: false}));
      await logout()
    }}>
      Sign out
    </DropdownMenuItem>
  );
};
