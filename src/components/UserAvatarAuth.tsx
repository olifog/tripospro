import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SignOutButton } from "./SignOutButton";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { getCurrentUser } from "@/queries/user";

export const UserAvatarAuth = async () => {
  const user = await getCurrentUser();

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.picture} />
          <AvatarFallback>{user.crsid}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.ravenId}</DropdownMenuLabel>
        {(user.tripos || user.triposPart) && (
          <DropdownMenuLabel className="flex space-x-2">
            {user.tripos && <Badge>{user.tripos.code}</Badge>}
            {user.triposPart && <Badge>{user.triposPart.name}</Badge>}
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button asChild>
      <Link href="/login/raven">Sign in</Link>
    </Button>
  );
};
