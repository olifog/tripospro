"use client";

import type Muuri from "muuri";
import { useEffect, useRef } from "react";
import { useQuestionsFilter } from "@/hooks/use-params";

export const MuuriGrid = ({ children }: { children: React.ReactNode }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<Muuri | null>(null);

  const [{ onlyCurrent, yearCutoff, search, view }] = useQuestionsFilter();

  const updateMuuri = () => {
    if (muuriRef.current) {
      const newElements = Array.from(
        gridRef.current?.children || []
      ) as HTMLElement[];
      const oldElements = muuriRef.current.getItems();
      const toAdd = newElements.filter(
        (newElement) =>
          !oldElements.some(
            (oldElement) => oldElement.getElement() === newElement
          )
      );
      const toRemove = oldElements.filter(
        (oldElement) =>
          !newElements.some(
            (newElement) => newElement === oldElement.getElement()
          )
      );

      muuriRef.current.add(toAdd);
      muuriRef.current.remove(toRemove);

      muuriRef.current.refreshItems();
      muuriRef.current.layout();
    }
  };

  useEffect(() => {
    const loadMuuri = async () => {
      if (gridRef.current && !muuriRef.current) {
        const Grid = (await import("muuri")).default;

        try {
          const isWideEnough = window.innerWidth > 512;
          muuriRef.current = new Grid(gridRef.current, {
            dragEnabled: isWideEnough,
            layout: {
              fillGaps: true
            }
          });
        } catch (_error) {
          // console.error("Error loading Muuri:", error);
        }

        setInterval(() => {
          if (muuriRef.current) {
            updateMuuri();
          }
        }, 100);
      }
    };
    loadMuuri();
  }, []);

  useEffect(() => {
    if (muuriRef.current) {
      updateMuuri();
    }
  }, [onlyCurrent, yearCutoff, search, view]);

  return (
    <div className="h-full w-full">
      <div ref={gridRef} className="h-full w-full">
        {children}
      </div>
    </div>
  );
};
