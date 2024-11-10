"use client";

import { getAllTriposes } from "@/queries/tripos";
import { troute } from "@/troute";
import { useState } from "react";
import { Combobox } from "../ui/combobox";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import Link from "next/link";
import { editUser } from "@/actions/user";
import { useRouter } from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
import { User } from "lucia";
import { triposPartToReadable } from "@/lib/utils";

export const ClientOnboarding = ({
  triposes,
  user,
}: {
  triposes: Awaited<ReturnType<typeof getAllTriposes>>;
  user: User | null;
}) => {
  const router = useRouter();

  const [selectedTriposId, setSelectedTriposId] = useState<number>();
  const [selectedTriposPartId, setSelectedTriposPartId] = useState<number>();

  const selectedTripos = triposes.find(
    (tripos) => tripos.id === selectedTriposId
  );

  const { data: triposParts, isLoading } = troute.getTriposParts({
    params: selectedTriposId,
    enabled: !!selectedTripos,
  });

  const selectedTriposPart = triposParts?.find(
    (triposPart) => triposPart.id === selectedTriposPartId
  );

  const [continuing, setContinuing] = useState(false);

  return (
    <div className="flex flex-col space-y-2 items-center">
      <Combobox
        options={triposes.map((tripos) => ({
          value: tripos.id.toString(),
          label: tripos.code,
        }))}
        defaultText="Tripos..."
        onChange={(value) => {
          setSelectedTriposId(
            triposes.find((tripos) => tripos.id.toString() === value)?.id
          );
        }}
        startingValue={selectedTriposId?.toString()}
      />
      {isLoading ? (
        <Skeleton className="w-32 h-8" />
      ) : (
        triposParts && (
          <Combobox
            options={triposParts.map((triposPart) => ({
              value: triposPart.id.toString(),
              label: triposPartToReadable(triposPart.name),
            }))}
            defaultText="Tripos Part..."
            onChange={(value) => {
              setSelectedTriposPartId(
                triposParts.find(
                  (triposPart) => triposPart.id.toString() === value
                )?.id
              );
            }}
            startingValue={selectedTriposPartId?.toString()}
          />
        )
      )}
      <div className="flex items-center pt-8">
        <Button
          disabled={continuing || !selectedTripos || !selectedTriposPart}
          onClick={async () => {
            if (!user) return;
            setContinuing(true);
            await editUser(user?.id, {
              triposId: selectedTriposId,
              triposPartId: selectedTriposPartId,
            });
            router.push(`/${selectedTripos?.code}/${selectedTriposPart?.name}`);
          }}
        >
          {continuing && <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />}
          Continue
        </Button>
        <Link href="/">
          <Button variant="link">Not applicable</Button>
        </Link>
      </div>
    </div>
  );
};
