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
import { SignInButton } from "./SignInButton";
import { triposPartToReadable } from "@/lib/utils";

export const UserAvatarAuth = async () => {
  const user = await getCurrentUser();

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          {user.picture && <AvatarImage src={user.picture} />}
          <AvatarFallback>
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-xs">{user.crsid}</span>
            </div>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.ravenId}</DropdownMenuLabel>
        {(user.tripos || user.triposPart) && (
          <DropdownMenuLabel className="flex space-x-2">
            {user.tripos && <Badge>{user.tripos.code}</Badge>}
            {user.triposPart && (
              <Badge>{triposPartToReadable(user.triposPart.name)}</Badge>
            )}
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
    <SignInButton />
  );
};
