
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { troute } from "@/troute";
import { getAllTriposes } from "@/queries/tripos";
import { getCurrentUser } from "@/queries/user";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LinkCombobox } from "./LinkCombobox";
import { useRecoilState } from "recoil";
import { viewState } from "@/atoms/view";

export const ClientViewSelector = ({
  triposes,
  user,
}: {
  triposes: Awaited<ReturnType<typeof getAllTriposes>>;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useRecoilState(viewState);


  const selectedTriposCode = pathname.split("/")[1];
  const selectedTripos = triposes.find(
    (tripos) => tripos.code === selectedTriposCode
  );

  const { data: triposParts, isLoading } = troute.getTriposParts({
    params: selectedTripos?.id,
    enabled: !!selectedTripos,
  });
  const selectedTriposPartName = pathname.split("/")[2];
  const selectedTriposPart = triposParts?.find(
    (triposPart) => triposPart.name === selectedTriposPartName
  );

  useEffect(() => {
    if (user && !view.autoSelected && (user.tripos || user.triposPart)) {
      let url = "/";
      if (user.tripos) {
        url += user.tripos.code;
        if (user.triposPart) {
          url += "/" + user.triposPart.name;
        }
      }
      router.push(url);
      setView((view) => ({ ...view, autoSelected: true }));
    }
  }, [router, user]);

  return (
    <div className="flex items-center space-x-2">
      <LinkCombobox
        options={triposes.map((tripos) => ({
          value: tripos.id.toString(),
          label: tripos.code,
          link: `/${tripos.code}`,
        }))}
        defaultText="Tripos..."
        startingValue={selectedTripos?.id.toString()}
      />
      {isLoading ? (
        <Skeleton className="w-32 h-8" />
      ) : (
        triposParts && (
          <LinkCombobox
            options={triposParts.map((triposPart) => ({
              value: triposPart.id.toString(),
              label: triposPart.name,
              link: `/${selectedTriposCode}/${triposPart.name}`,
            }))}
            defaultText="Part..."
            startingValue={selectedTriposPart?.id.toString()}
          />
        )
      )}
    </div>
  );
};

