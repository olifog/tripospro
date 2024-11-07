/*
  Warnings:

  - A unique constraint covering the columns `[courseId,year]` on the table `CourseYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseYearId,lecturerId]` on the table `CourseYearLecturer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CourseYear_courseId_year_key" ON "CourseYear"("courseId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CourseYearLecturer_courseYearId_lecturerId_key" ON "CourseYearLecturer"("courseYearId", "lecturerId");
