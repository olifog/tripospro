"use client";

import { cn } from "@/lib/utils";
import PdfViewer from "../PdfViewer";
import { getQuestionAnswers, getQuestionByPath } from "@/queries/question";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { EllipsisVertical } from "lucide-react";
import { RightPanel } from "./RightPanel";
import { getCurrentUser } from "@/queries/user";

export const QuestionPage = ({
  question,
  answers,
  user,
}: {
  question: NonNullable<Awaited<ReturnType<typeof getQuestionByPath>>>;
  answers?: Awaited<ReturnType<typeof getQuestionAnswers>>;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <div
      className={cn(
        "w-full h-screen absolute top-0 flex -z-10",
        fullScreen ? "z-[1000]" : "pt-32 max-w-screen-xl"
      )}
    >
      <PanelGroup
        direction="horizontal"
        className="dark:bg-gray-900 bg-slate-50"
      >
        <Panel defaultSize={50} minSize={50}>
          <PdfViewer
            url={`https://www.cl.cam.ac.uk/teaching/exams/pastpapers/${question.questionUrl}`}
          />
        </Panel>
        <PanelResizeHandle className="w-2 bg-slate-700 ml-1 rounded-md flex items-center justify-center">
          <EllipsisVertical className="absolute w-4 h-4 text-slate-300" />
        </PanelResizeHandle>
        <Panel defaultSize={50} minSize={20} maxSize={50} collapsible={true}>
          <RightPanel
            question={question}
            answers={answers}
            fullScreen={fullScreen}
            setFullScreen={setFullScreen}
            user={user}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
