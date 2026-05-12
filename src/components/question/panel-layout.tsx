"use client";

import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle
} from "react-resizable-panels";

import { EllipsisVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const SplitQuestionLayout = ({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) => {
  const mobile = useIsMobile();

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
          {left}
        </Panel>
        <PanelResizeHandle className="ml-1 flex w-2 items-center justify-center rounded-md bg-border">
          <EllipsisVertical className="absolute h-4 w-4 text-muted-foreground" />
        </PanelResizeHandle>
        <Panel defaultSize={50} minSize={20} collapsible>
          <div className="ml-1 h-full overflow-x-hidden overflow-y-scroll bg-muted/30">
            {right}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};
