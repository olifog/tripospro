"use client";

import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
  usePanelRef
} from "react-resizable-panels";

import { ChevronsLeft, EllipsisVertical } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";

const CollapseRightPanelContext = createContext<(() => void) | null>(null);

export function useCollapseRightPanel() {
  return useContext(CollapseRightPanelContext);
}

export const SplitQuestionLayout = ({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) => {
  const mobile = useIsMobile();
  const rightPanelRef = usePanelRef();
  const [collapsed, setCollapsed] = useState(false);

  if (mobile) {
    return (
      <div className="flex h-full w-full flex-col gap-4">
        {left}
        {right}
      </div>
    );
  }

  return (
    <div className="relative flex h-full max-h-[calc(100vh-4rem)] w-full">
      <PanelGroup orientation="horizontal" className="flex-1">
        <Panel defaultSize={50} minSize={30}>
          <div className="relative h-full">
            {left}
            {collapsed && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 h-7 w-7"
                onClick={() => {
                  rightPanelRef.current?.expand();
                  setCollapsed(false);
                }}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Panel>
        <PanelResizeHandle className="ml-1 flex w-2 items-center justify-center rounded-md bg-border">
          <EllipsisVertical className="absolute h-4 w-4 text-muted-foreground" />
        </PanelResizeHandle>
        <Panel
          defaultSize={50}
          minSize={20}
          collapsible
          panelRef={rightPanelRef}
          onResize={(size) => setCollapsed(size.asPercentage === 0)}
        >
          <CollapseRightPanelContext.Provider
            value={() => {
              rightPanelRef.current?.collapse();
              setCollapsed(true);
            }}
          >
            <div className="ml-1 h-full overflow-x-hidden overflow-y-scroll bg-muted/30">
              {right}
            </div>
          </CollapseRightPanelContext.Provider>
        </Panel>
      </PanelGroup>
    </div>
  );
};
