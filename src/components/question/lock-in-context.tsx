"use client";

import { createContext, useContext, useState } from "react";

type LockInContextType = {
  lockedIn: boolean;
  setLockedIn: (v: boolean) => void;
};

const LockInContext = createContext<LockInContextType>({
  lockedIn: false,
  setLockedIn: () => {}
});

export function LockInProvider({ children }: { children: React.ReactNode }) {
  const [lockedIn, setLockedIn] = useState(false);

  return (
    <LockInContext.Provider value={{ lockedIn, setLockedIn }}>
      {children}
    </LockInContext.Provider>
  );
}

export function useLockIn() {
  return useContext(LockInContext);
}
