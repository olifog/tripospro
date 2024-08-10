"use client";

import { RecoilRoot } from "recoil";

export const ClientRoot = ({ children }: { children: React.ReactNode }) => {
  return (
    <RecoilRoot>
      <div className="flex flex-col items-center w-full h-full">{children}</div>
    </RecoilRoot>
  );
};
