-- DropForeignKey
ALTER TABLE "CourseYearLecturer" DROP CONSTRAINT "CourseYearLecturer_courseYearId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "picture" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CourseYearLecturer" ADD CONSTRAINT "CourseYearLecturer_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
