import { Skeleton } from "../ui/skeleton";

export function CommentSkeleton() {
  return (
    <div className="flex gap-2 py-2">
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-5" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function CommentThreadSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <CommentSkeleton />
      <CommentSkeleton />
      <CommentSkeleton />
    </div>
  );
}
