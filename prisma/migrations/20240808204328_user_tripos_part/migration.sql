/*
  Warnings:

  - Added the required column `courseYearId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "courseYearId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "triposPartId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_triposPartId_fkey" FOREIGN KEY ("triposPartId") REFERENCES "TriposPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
