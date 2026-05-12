"use client";

import type Muuri from "muuri";
import { useCallback, useEffect, useRef } from "react";
import { useQuestionsFilter } from "@/hooks/use-params";

export const MuuriGrid = ({
  children,
  emptyMessage
}: {
  children: React.ReactNode;
  emptyMessage?: React.ReactNode;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<Muuri | null>(null);

  const [
    { onlyCurrent, onlyStarred, yearCutoff, search, view, showQuestionNumbers }
  ] = useQuestionsFilter();

  const syncItems = useCallback(() => {
    if (!muuriRef.current || !gridRef.current) return;

    const newElements = Array.from(gridRef.current.children) as HTMLElement[];
    const oldItems = muuriRef.current.getItems();
    const toAdd = newElements.filter(
      (el) => !oldItems.some((item) => item.getElement() === el)
    );
    const toRemove = oldItems.filter(
      (item) => !newElements.some((el) => el === item.getElement())
    );

    if (toAdd.length > 0) muuriRef.current.add(toAdd);
    if (toRemove.length > 0) muuriRef.current.remove(toRemove);

    muuriRef.current.refreshItems();
    muuriRef.current.layout();
  }, []);

  useEffect(() => {
    if (!gridRef.current || muuriRef.current) return;

    let destroyed = false;

    const loadMuuri = async () => {
      const Grid = (await import("muuri")).default;
      if (destroyed || !gridRef.current) return;

      muuriRef.current = new Grid(gridRef.current, {
        dragEnabled: window.innerWidth > 512,
        layout: { fillGaps: true }
      });
    };

    loadMuuri();

    return () => {
      destroyed = true;
      if (muuriRef.current) {
        muuriRef.current.destroy();
        muuriRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => syncItems());
  }, [
    onlyCurrent,
    onlyStarred,
    yearCutoff,
    search,
    view,
    showQuestionNumbers,
    syncItems
  ]);

  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new MutationObserver(() => {
      syncItems();
    });

    observer.observe(gridRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [syncItems]);

  useEffect(() => {
    if (!gridRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (muuriRef.current) {
        muuriRef.current.refreshItems();
        muuriRef.current.layout();
      }
    });

    resizeObserver.observe(gridRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Count non-null children to show empty state
  const childArray = Array.isArray(children) ? children : [children];
  const visibleCount = childArray.filter(Boolean).length;

  return (
    <div className="w-full">
      {visibleCount === 0 && emptyMessage && (
        <div className="flex min-h-32 items-center justify-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      )}
      <div ref={gridRef} className="w-full">
        {children}
      </div>
    </div>
  );
};
