import { DarkModeToggle } from "./DarkModeToggle";
import { Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { UserAvatarAuth } from "./UserAvatarAuth";
import Link from "next/link";
import { BackButton } from "./BackButton";
import { ViewBreadcrumb } from "./ViewBreadcrumb";

export const Header = async ({
  showBreadcrumb = true,
}: {
  showBreadcrumb?: boolean;
}) => {
  return (
    <header className="w-full max-w-screen-md mx-auto p-1 px-4 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <div className="h-20 flex flex-row items-center space-x-6 w-full">
          <Link href="/">
            <h1 className="text-3xl font-bold">Tripos Pro</h1>
          </Link>
          <BackButton />
          <nav className="flex items-center"></nav>
        </div>
        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <Suspense fallback={<Skeleton className="w-10 h-10 rounded-full" />}>
            <UserAvatarAuth />
          </Suspense>
        </div>
      </div>
      <div className="flex h-12">
        {showBreadcrumb && (
          <Suspense fallback={<Skeleton className="w-24 h-6" />}>
            <ViewBreadcrumb />
          </Suspense>
        )}
      </div>
    </header>
  );
};
