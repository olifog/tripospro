import { useEffect, useState } from "react";

export const useStoredState = <T>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    if (state !== initialValue) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, key, initialValue]);

  useEffect(() => {
    const storedState = localStorage.getItem(key);
    if (storedState) {
      setState(JSON.parse(storedState));
    }
  }, [key]);

  const setStoredState = (value: T) => {
    setState(value);
  };

  return [state, setStoredState] as const;
};
