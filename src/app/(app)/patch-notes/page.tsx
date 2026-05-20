import {
  Bot,
  ExternalLink,
  BarChart3,
  MessageSquare,
  Sparkles,
  Save,
  Plug
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Separator } from "@/components/ui/separator";

const patches = [
  {
    version: "2",
    date: "May 2025",
    title: "Course Pages, MCP & Social",
    items: [
      {
        icon: BarChart3,
        title: "Course Pages",
        description:
          "Dedicated pages per course with mark stats, AI topic tags, popularity, and lecturer history.",
        link: { href: "/questions", label: "Browse courses" }
      },
      {
        icon: Sparkles,
        title: "Similar Questions",
        description:
          "Vector-powered recommendations on every question page — find related problems across years."
      },
      {
        icon: MessageSquare,
        title: "Discussions",
        description:
          "Threaded comments with voting on every question. Share approaches or ask for help."
      },
      {
        icon: Save,
        title: "Saved Chats",
        description:
          "RAG Bot conversations persist across sessions. Review past answers anytime.",
        link: { href: "/chat", label: "Open RAG Bot" }
      },
      {
        icon: Plug,
        title: "MCP Server",
        description:
          "Access TriposPro data from Claude Desktop, Cursor, or any MCP client. Search questions, browse courses, and query stats programmatically.",
        link: {
          href: "https://github.com/olifog/tripospro",
          label: "Setup instructions"
        }
      }
    ]
  },
  {
    version: "1",
    date: "April 2025",
    title: "Launch",
    items: [
      {
        icon: Bot,
        title: "RAG Bot",
        description:
          "AI chatbot with retrieval-augmented generation over the full question database."
      },
      {
        icon: BarChart3,
        title: "Question Database",
        description:
          "All Cambridge CST exam questions with marks, examiner comments, and solution links."
      }
    ]
  }
];

export default function PatchNotesPage() {
  return (
    <PageLayout header={<h1>What&apos;s New</h1>}>
      <div className="max-w-2xl space-y-8">
        {patches.map((patch) => (
          <div key={patch.version} className="space-y-4">
            <div>
              <h2 className="font-semibold text-lg">{patch.title}</h2>
              <p className="text-muted-foreground text-xs">{patch.date}</p>
            </div>
            <div className="space-y-3">
              {patch.items.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                    {"link" in item && item.link && (
                      <a
                        href={item.link.href}
                        target={item.link.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        {item.link.label}
                        {item.link.href.startsWith("http") && (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
