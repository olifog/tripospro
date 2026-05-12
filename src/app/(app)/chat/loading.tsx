import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 pt-32">
      <Skeleton className="h-16 w-full max-w-md" />
      <Skeleton className="h-10 w-full max-w-md" />
    </div>
  );
}
