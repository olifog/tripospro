import { DarkModeToggle } from "./DarkModeToggle";
import { Suspense } from "react";
import { Skeleton } from "./ui/skeleton";
import { UserAvatarAuth } from "./UserAvatarAuth";
import Link from "next/link";
import { ViewSelector } from "./ViewSelector";
import { BackButton } from "./BackButton";

export const Header = async ({
  viewSelector=false,
  backButton=false
}: {
  viewSelector?: boolean;
  backButton?: boolean;
}) => {
  return (
    <header className="h-20 w-full max-w-screen-lg mx-auto p-1 flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-6">
        <Link href="/">
          <h1 className="text-3xl font-bold">Tripos Pro</h1>
        </Link>
        {
          backButton && (
            <BackButton />
          )
        }
        {
          viewSelector && (
            <Suspense fallback={<Skeleton className="w-32 h-8" />}>
              <ViewSelector />
            </Suspense>
          )
        }
        <nav className="flex items-center"></nav>
      </div>
      <div className="flex items-center space-x-4">
        <DarkModeToggle />
        <Suspense fallback={<Skeleton className="w-10 h-10 rounded-full" />}>
          <UserAvatarAuth />
        </Suspense>
      </div>
    </header>
  );
};
