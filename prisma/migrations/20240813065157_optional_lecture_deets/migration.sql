-- DropForeignKey
ALTER TABLE "Lecture" DROP CONSTRAINT "Lecture_locationId_fkey";

-- AlterTable
ALTER TABLE "Lecture" ALTER COLUMN "time" DROP NOT NULL,
ALTER COLUMN "locationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
