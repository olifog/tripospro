# Feature Plan

## 1. Question Topics (AI Clustering)

**Goal:** Assign discrete topic tags to every question, enabling topic-level filtering, progress tracking, and gap analysis.

**Approach:**
- New ingestion script that groups all questions per course (using extracted text from Pinecone)
- LLM call per course: given all question texts for a course across all years, output 5-15 topic buckets (e.g. "dynamic programming", "graph traversal", "amortised analysis")
- Second pass: assign each question 1-3 topics from the course's bucket list
- Store in new tables: `question_topic` and `topic` (with courseId foreign key)

**Schema:**
```sql
topic (id, courseId, name, slug, createdAt)
question_topic (id, questionId, topicId, confidence, createdAt)
```

**UX:**
- Filter chips on the questions grid per course
- Topic breakdown on the course page
- "Topics covered" progress indicator per user per course

---

## 2. Similar Questions on Question Page

**Goal:** When viewing any question, show 3-5 semantically similar questions from other years using existing Pinecone embeddings.

**Approach:**
- On question page load, query Pinecone with the current question's embedding vector
- Filter out same question, return top 5 from different years/papers
- Display as compact cards in a new section on the right panel or below the PDF

**Implementation:**
- New tRPC procedure: `question.getSimilarQuestions(questionId)`
- Fetch the question's vector from Pinecone by ID, then query for nearest neighbors
- Exclude same paperYear, optionally filter to same course or allow cross-course
- Render as linked cards with year, paper, course, and difficulty indicator

**UX:**
- "Similar Questions" section below the question metadata on the right panel
- Each card shows: year, paper number, question number, course name, median mark
- Click navigates to that question

---

## 3. Examiner Comment Insights

**Goal:** Aggregate examiner comments per course into "common mistakes" and "what examiners look for" summaries.

**Approach:**
- Batch LLM job per course: collect all examiner comments across all years for that course
- Prompt: "Given these examiner comments from [Course] spanning [years], identify the top recurring themes, common mistakes students make, and what examiners consistently reward"
- Store generated insights per course
- Re-run annually after new reports are ingested

**Schema:**
```sql
course_insight (id, courseId, content, generatedAt, modelUsed, createdAt)
```

**UX:**
- "Examiner Insights" tab or card on the course page
- Bullet-point format with supporting quotes from specific years
- Badge showing "Generated from N years of examiner reports"
- Optionally: per-topic insights once question topics exist
