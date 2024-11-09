/*
  Warnings:

  - A unique constraint covering the columns `[name,triposPartId]` on the table `Paper` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paperId,year]` on the table `PaperYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseYearId,questionNumber]` on the table `Question` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paperYearId,questionNumber]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Paper_name_triposPartId_key" ON "Paper"("name", "triposPartId");

-- CreateIndex
CREATE UNIQUE INDEX "PaperYear_paperId_year_key" ON "PaperYear"("paperId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Question_courseYearId_questionNumber_key" ON "Question"("courseYearId", "questionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Question_paperYearId_questionNumber_key" ON "Question"("paperYearId", "questionNumber");
