/*
  Warnings:

  - Added the required column `description` to the `CourseYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `easter` to the `CourseYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lectures` to the `CourseYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lent` to the `CourseYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `michaelmas` to the `CourseYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggestedSupervisions` to the `CourseYear` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CourseYear" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "easter" BOOLEAN NOT NULL,
ADD COLUMN     "lectures" INTEGER NOT NULL,
ADD COLUMN     "lent" BOOLEAN NOT NULL,
ADD COLUMN     "michaelmas" BOOLEAN NOT NULL,
ADD COLUMN     "suggestedSupervisions" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lecturer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Lecture" (
    "id" SERIAL NOT NULL,
    "courseYearId" INTEGER NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "slidesLink" TEXT,
    "recordingLink" TEXT,
    "summary" TEXT,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "partOfId" INTEGER,
    "googleMapsURL" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tick" (
    "id" SERIAL NOT NULL,
    "courseYearId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseYearPrerequisite" (
    "id" SERIAL NOT NULL,
    "courseYearId" INTEGER NOT NULL,
    "prerequisiteId" INTEGER NOT NULL,

    CONSTRAINT "CourseYearPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseYearLecturer" (
    "id" SERIAL NOT NULL,
    "courseYearId" INTEGER NOT NULL,
    "lecturerId" TEXT NOT NULL,

    CONSTRAINT "CourseYearLecturer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_partOfId_fkey" FOREIGN KEY ("partOfId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tick" ADD CONSTRAINT "Tick_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseYearPrerequisite" ADD CONSTRAINT "CourseYearPrerequisite_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseYearPrerequisite" ADD CONSTRAINT "CourseYearPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "CourseYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseYearLecturer" ADD CONSTRAINT "CourseYearLecturer_courseYearId_fkey" FOREIGN KEY ("courseYearId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseYearLecturer" ADD CONSTRAINT "CourseYearLecturer_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
