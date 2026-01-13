import { ExternalLink, Github } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <PageLayout header={<h1>About</h1>}>
      <div className="max-w-2xl space-y-8">
        {/* Main description */}
        <div className="">
          <div className="text-foreground text-sm leading-relaxed">
            <p>
              Tripos Pro is a study tool for Cambridge Computer Science
              students. It consists of:
            </p>
            <ul className="list-inside list-disc">
              <li>A database of all past questions, across all years</li>
              <li>A chatbot that can answer questions about past questions</li>
              <li>
                Individual question pages, with statistics, examiner comments,
                and solution links
              </li>
            </ul>
          </div>
          <br />
          <div className="text-foreground text-sm leading-relaxed">
            <p>
              <span className="font-bold">Protip:</span> you can go directly
              from a CST question page to the corresponding
              <span className="font-bold"> tripos.pro </span>
              question page by changing the page's domain name to{" "}
              <span className="font-bold">tripos.pro</span>. e.g.
            </p>
            <div className="flex flex-col pl-4">
              <br />
              <span className="font-bold">
                https://www.cl.cam.ac.uk/teaching/exams/pastpapers/y2023p7q3.pdf
              </span>
              <br />
              becomes
              <br />
              <span className="font-bold">
                https://tripos.pro/teaching/exams/pastpapers/y2023p7q3.pdf
              </span>{" "}
              (the www. is optional)
            </div>
          </div>
        </div>

        <Separator />

        {/* GitHub section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Open Source</h2>
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
              <Github className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <Separator />

        {/* Made by section */}
        <div className="space-y-3">
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
