-- AlterTable
ALTER TABLE "User" ADD COLUMN     "triposId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_triposId_fkey" FOREIGN KEY ("triposId") REFERENCES "Tripos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
