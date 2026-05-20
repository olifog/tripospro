import { PageLayout } from "@/components/layout/page-layout";

const patches = [
  {
    date: "20 May 2026",
    title: "MCP Server",
    items: [
      "TriposPro data accessible via Model Context Protocol",
      "Connect Claude Desktop, Cursor, or any MCP client to search questions and query stats",
      "URL: https://tripos.pro/api/mcp/mcp",
    ]
  },
  {
    date: "18 May 2026",
    title: "Search, Topics & Similar Questions",
    items: [
      "Command palette with hybrid search (structured, fuzzy, and semantic)",
      "AI-generated topic tags on every question",
      "Similar questions panel on question pages via vector embeddings",
      "Course page rework with topic breakdown and popularity stats",
      "Topics shown inline on search results",
    ]
  },
  {
    date: "12 May 2026",
    title: "Discussions, Saved Chats & Bookmarks",
    items: [
      "Threaded comment discussions on every question with voting and pinning",
      "RAG Bot conversations persist across sessions",
      "Bookmark questions to revisit later",
      "Score colour gradients on question marks",
      "Profile page polish with contribution stats",
    ]
  },
  {
    date: "14 Jan 2026",
    title: "Course Pages",
    items: [
      "Dedicated page per course with mark statistics across all years",
      "Lecturer history and term breakdown",
    ]
  },
  {
    date: "1 Jun 2025",
    title: "Question Context",
    items: [
      "Course card shown on each question page",
      "Quick navigation to other questions in the same course",
    ]
  },
  {
    date: "Mar 2025",
    title: "Launch",
    items: [
      "Searchable database of all Cambridge CST exam questions",
      "Mark statistics, examiner comments, and solution links per question",
      "RAG chatbot over the full question database",
      "Answer tracking with time and mark logging",
      "URL redirect from cl.cam.ac.uk question URLs to tripos.pro",
      "User profiles with Cambridge Raven authentication",
    ]
  }
];

export default function PatchNotesPage() {
  return (
    <PageLayout header={<h1>What&apos;s New</h1>}>
      <div className="max-w-xl space-y-6">
        {patches.map((patch) => (
          <div key={patch.date}>
            <div className="flex items-baseline gap-3">
              <h2 className="font-medium text-sm">{patch.title}</h2>
              <span className="text-muted-foreground text-xs">{patch.date}</span>
            </div>
            <ul className="mt-1.5 list-inside list-disc text-muted-foreground text-xs leading-relaxed">
              {patch.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
