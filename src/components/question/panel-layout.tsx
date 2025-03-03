"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useIsMobile } from "@/hooks/use-mobile";
import { EllipsisVertical } from "lucide-react";

export const SplitQuestionLayout = ({
  left,
  right
}: { left: React.ReactNode; right: React.ReactNode }) => {
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <div className="flex h-full w-full flex-col gap-4">
        {right}
        {left}
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={50} minSize={50}>
        {left}
      </Panel>
      <PanelResizeHandle className="ml-1 flex w-2 items-center justify-center rounded-md bg-slate-700">
        <EllipsisVertical className="absolute h-4 w-4 text-slate-300" />
      </PanelResizeHandle>
      <Panel defaultSize={50} maxSize={50} minSize={20}>
        {right}
      </Panel>
    </PanelGroup>
  );
};
