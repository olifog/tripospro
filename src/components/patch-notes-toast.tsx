"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";

const CURRENT_VERSION = "2";
const STORAGE_KEY = "tripospro-patch-notes-seen";

export function PatchNotesToast() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setTimeout(() => setVisible(false), 200);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed right-4 bottom-20 z-50 ${exiting ? "animate-out fade-out slide-out-to-bottom-4 duration-200" : "animate-in fade-in slide-in-from-bottom-4 duration-300"}`}
    >
      <div className="flex w-72 items-start gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm">What&apos;s New</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Topics, similar questions, discussions & more
          </p>
          <button
            type="button"
            onClick={() => {
              dismiss();
              router.push("/patch-notes");
            }}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            See details
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
