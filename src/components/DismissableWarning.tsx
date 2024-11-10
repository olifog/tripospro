"use client";

import { XIcon } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

export const DismissableWarning = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [dismissed, setDismissed] = useLocalStorage("dismissedWarning", false, {
    initializeWithValue: false,
  });

  if (dismissed) return null;

  return (
    <div className="relative w-full max-w-xl py-1 rounded-md border-orange-400 border-2 bg-orange-300 flex items-center justify-center">
      <p className="text-xs font-semibold text-orange-800">{children}</p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute text-orange-800 right-1"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
