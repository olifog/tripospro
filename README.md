
# tripos.pro

Tripos Pro is a study tool for Cambridge Computer Science students. It consists of:
- a database of all past questions, across all years (and scripts for ingesting this data from the department's sources)
- a chatbot that can answer questions about past questions
- individual question pages, with statistics, examiner comments, and solution links

PRs/issues are super welcome!!

### technical details:
- Next.js 15 app router, built with trpc + react query + tailwind + shadcn
- Data ingestion is done through a collection of python scripts in the `scripts` dir, had to write a grammar for one of the department's goofy formats https://github.com/olifog/tripospro/blob/main/scripts/coursedb-parser/grammar.pegjs
- database is a serverless postgres database, hosted on Neon
- auth is Clerk, with an adapted Google OAuth provider for Cambridge Raven
- webapp hosting is on Vercel
