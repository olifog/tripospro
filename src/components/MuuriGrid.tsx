"use client";

import { useRef, useEffect, useContext, ComponentType, useState } from "react";
import CourseFilterContext from "./CourseFilter/courseFilterContext";
import type Muuri from "muuri";

export const MuuriGrid = ({ children }: { children: React.ReactNode }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<Muuri | null>(null);

  const {
    onlyCurrent,
    yearCutoff,
    onlyExamined,
    hideCurrentYear,
  } = useContext(CourseFilterContext);

  const updateMuuri = () => {
    if (muuriRef.current) {
      const newElements = Array.from(gridRef.current?.children || []) as HTMLElement[];
      const oldElements = muuriRef.current.getItems();
      const toAdd = newElements.filter((newElement) => !oldElements.some((oldElement) => oldElement.getElement() === newElement));
      const toRemove = oldElements.filter((oldElement) => !newElements.some((newElement) => newElement === oldElement.getElement()));

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
          muuriRef.current = new Grid(gridRef.current, {
            dragEnabled: true,
            layout: {
              fillGaps: true,
            },
          });
        } catch (error) {
          console.error("Error loading Muuri:", error);
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
  }, [onlyCurrent, yearCutoff, onlyExamined, hideCurrentYear]);
  
  return (
    <div className="w-full h-full">
      <div ref={gridRef} className="w-full h-full">
        {children}
      </div>
    </div>
  );
};
