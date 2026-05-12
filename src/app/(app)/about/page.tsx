import { ExternalLink } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <PageLayout header={<h1>About</h1>}>
      <div className="max-w-2xl space-y-6">
        {/* Main description */}
        <div className="">
          <p className="text-foreground text-sm leading-relaxed">
            Tripos Pro is a study tool for Cambridge Computer Science students.
            It consists of:
          </p>
          <ul className="mt-2 list-inside list-disc text-foreground text-sm leading-relaxed">
            <li>A database of all past questions, across all years</li>
            <li>A chatbot that can answer questions about past questions</li>
            <li>
              Individual question pages, with statistics, examiner comments, and
              solution links
            </li>
          </ul>
          <br />
          <p className="text-foreground text-sm leading-relaxed">
            <span className="font-bold">Protip:</span> you can go directly from
            a CST question page to the corresponding
            <span className="font-bold"> tripos.pro </span>
            question page by changing the page's domain name to{" "}
            <span className="font-bold">tripos.pro</span>.
          </p>
          <div className="mt-2 flex flex-col gap-1 pl-4 text-sm">
            <span className="font-bold">
              https://www.cl.cam.ac.uk/teaching/exams/pastpapers/y2023p7q3.pdf
            </span>
            <span className="text-muted-foreground">becomes</span>
            <span className="font-bold">
              https://tripos.pro/teaching/exams/pastpapers/y2023p7q3.pdf
            </span>
            <span className="text-muted-foreground text-xs">
              (the www. is optional)
            </span>
          </div>
        </div>

        <Separator />

        {/* GitHub section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GithubIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Open Source</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Found a bug or have a feature request? Contributions are welcome!
          </p>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://github.com/olifog/tripospro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <GithubIcon className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <Separator />

        {/* Made by section */}
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-foreground text-sm">
            Made by{" "}
            <a
              href="https://www.olifog.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline"
            >
              Oliver Fogelin <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
