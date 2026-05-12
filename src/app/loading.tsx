import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-8 w-32" />
    </div>
  );
}
