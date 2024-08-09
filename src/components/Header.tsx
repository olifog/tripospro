
import { DarkModeToggle } from "./DarkModeToggle";
import { Avatar } from "./ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { validateRequest } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export const Header = async () => {
  const { user } = await validateRequest();

  return (
    <header className="h-20 w-full max-w-screen-lg mx-auto p-1 flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">Tripos Pro</h1>
        <nav className="flex items-center"></nav>
      </div>
      <div className="flex items-center space-x-6">
        <DarkModeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage src={user.picture} />
                <AvatarFallback>{user.crsid}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.ravenId}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login/raven">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
