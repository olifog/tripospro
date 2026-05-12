"use client";

import "katex/dist/katex.min.css";

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

const CRSID_PATTERN = /(?<![`\w])@([a-z]{2,10}\d{1,4})(?![\w`])/g;

function preprocessMentions(content: string): string {
  const lines = content.split("\n");
  return lines
    .map((line) => {
      if (line.startsWith("    ") || line.startsWith("\t")) return line;
      const parts = line.split(/(`[^`]*`)/);
      return parts
        .map((part, i) => {
          if (i % 2 === 1) return part;
          return part.replace(CRSID_PATTERN, "[@$1](/profile/$1)");
        })
        .join("");
    })
    .join("\n");
}

export function CommentContent({
  content,
  className
}: {
  content: string;
  className?: string;
}) {
  const processed = preprocessMentions(content);

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
        "prose-pre:my-2 prose-code:text-xs prose-pre:text-xs",
        className
      )}
    >
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        allowedElements={[
          "p",
          "strong",
          "em",
          "del",
          "u",
          "ul",
          "ol",
          "li",
          "code",
          "pre",
          "a",
          "br",
          "sup",
          "sub",
          "blockquote",
          // KaTeX renders into spans/divs with MathML elements
          "span",
          "div",
          "math",
          "semantics",
          "mrow",
          "mi",
          "mo",
          "mn",
          "msup",
          "msub",
          "mfrac",
          "mover",
          "munder",
          "mtable",
          "mtr",
          "mtd",
          "annotation",
          "section"
        ]}
        components={{
          // Downgrade headings to bold paragraphs
          h1: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          h2: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          h3: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          h4: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          h5: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          h6: ({ children }) => (
            <p>
              <strong>{children}</strong>
            </p>
          ),
          a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
            if (href?.startsWith("/profile/")) {
              return (
                <Link
                  href={href}
                  className="font-medium text-primary no-underline hover:underline"
                  {...props}
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      />
    </div>
  );
}
