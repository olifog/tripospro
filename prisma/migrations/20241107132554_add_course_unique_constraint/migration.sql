/*
  Warnings:

  - A unique constraint covering the columns `[code,triposPartId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Course_code_triposPartId_key" ON "Course"("code", "triposPartId");
