"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  Search
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { useClientHref } from "@/components/link/client";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";

const RECENT_SEARCHES_KEY = "tripospro-recent-searches";
const MAX_RECENT = 8;

type RecentItem = {
  id: string;
  title: string;
  href: string;
  type: "course" | "question" | "paper";
};

function getRecentSearches(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(item: RecentItem) {
  const recent = getRecentSearches().filter((r) => r.id !== item.id);
  recent.unshift(item);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

export function SearchDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const router = useRouter();
  const getHref = useClientHref();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setRecentItems(getRecentSearches());
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setDebouncedQuery("");
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: courses } = trpc.search.courses.useQuery(undefined, {
    staleTime: Infinity
  });

  const { data: serverResults, isFetching } = trpc.search.hybrid.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2, staleTime: 30000 }
  );

  type Result = {
    id: string;
    type: "course" | "question" | "paper";
    title: string;
    subtitle?: string;
    href: string;
    score: number;
    source: "exact" | "fuzzy" | "semantic";
    meta?: {
      year?: number;
      paperNumber?: string;
      questionNumber?: number;
      courseName?: string;
      medianMark?: number | null;
    };
  };

  const clientResults = useMemo((): Result[] => {
    if (!query || query.length < 2 || !courses) return [];
    const q = query.toLowerCase();
    return courses
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: `course-${c.id}`,
        type: "course" as const,
        title: c.name,
        subtitle: c.code,
        href: `/course/${c.id}`,
        score: c.name.toLowerCase().startsWith(q) ? 0.95 : 0.8,
        source: "fuzzy" as const
      }));
  }, [query, courses]);

  const displayResults = useMemo((): Result[] => {
    if (!query || query.length < 2) return [];

    if (!serverResults) return clientResults;

    const merged = new Map<string, Result>();
    for (const r of serverResults) {
      merged.set(r.id, r);
    }
    for (const r of clientResults) {
      if (!merged.has(r.id)) {
        merged.set(r.id, r);
      }
    }

    return [...merged.values()].sort((a, b) => b.score - a.score);
  }, [query, serverResults, clientResults]);

  const courseResults = displayResults.filter((r) => r.type === "course");
  const questionResults = displayResults.filter((r) => r.type === "question");
  const paperResults = displayResults.filter((r) => r.type === "paper");

  const handleSelect = useCallback(
    (result: { id: string; title: string; href: string; type: string }) => {
      addRecentSearch({
        id: result.id,
        title: result.title,
        href: result.href,
        type: result.type as RecentItem["type"]
      });
      onOpenChange(false);
      router.push(getHref(result.href));
    },
    [router, getHref, onOpenChange]
  );

  const typeIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="text-muted-foreground" />;
      case "question":
        return <HelpCircle className="text-muted-foreground" />;
      case "paper":
        return <FileText className="text-muted-foreground" />;
      default:
        return <Search className="text-muted-foreground" />;
    }
  };

  const hasQuery = query.length >= 2;
  const hasResults =
    courseResults.length > 0 ||
    questionResults.length > 0 ||
    paperResults.length > 0;
  const showLoading = hasQuery && isFetching && !hasResults;
  const showEmpty = hasQuery && !isFetching && !hasResults && debouncedQuery.length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search questions, courses, papers... (e.g. P3Q2, Algorithms)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {showLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        )}

        {showEmpty && (
          <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {!hasQuery && recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => handleSelect(item)}
              >
                <Clock className="text-muted-foreground" />
                <span className="flex-1 truncate">{item.title}</span>
                <TypeBadge type={item.type} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {courseResults.length > 0 && (
          <CommandGroup heading="Courses">
            {courseResults.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => handleSelect(result)}
              >
                {typeIcon(result.type)}
                <span className="flex-1 truncate">{result.title}</span>
                {result.subtitle && (
                  <span className="text-xs text-muted-foreground">
                    {result.subtitle}
                  </span>
                )}
                {result.source === "semantic" && (
                  <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                    semantic
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {questionResults.length > 0 && (
          <>
            {courseResults.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Questions">
              {questionResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  {typeIcon(result.type)}
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    <span className="truncate">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {result.meta?.medianMark != null && (
                      <span className="text-xs text-muted-foreground">
                        median: {result.meta.medianMark}/20
                      </span>
                    )}
                    {result.source === "semantic" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        semantic
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {paperResults.length > 0 && (
          <>
            {(courseResults.length > 0 || questionResults.length > 0) && (
              <CommandSeparator />
            )}
            <CommandGroup heading="Papers">
              {paperResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  {typeIcon(result.type)}
                  <span className="flex-1 truncate">{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {hasQuery && isFetching && hasResults && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading more results...
          </div>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
            close
          </span>
        </div>
        <span>
          Try: <code className="text-foreground">P3Q2</code>,{" "}
          <code className="text-foreground">Algorithms</code>,{" "}
          <code className="text-foreground">graph traversal</code>
        </span>
      </div>
    </CommandDialog>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors = {
    course: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    question: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    paper: "bg-green-500/10 text-green-600 dark:text-green-400"
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[type as keyof typeof colors] ?? ""}`}
    >
      {type}
    </span>
  );
}
