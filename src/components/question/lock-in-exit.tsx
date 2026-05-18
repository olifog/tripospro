"use client";

import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useLockIn } from "./lock-in-context";

export function LockInExit() {
  const { lockedIn, setLockedIn } = useLockIn();

  if (!lockedIn) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 px-2 text-xs"
      onClick={() => setLockedIn(false)}
    >
      <X className="h-3 w-3" />
      Exit focus
    </Button>
  );
}
