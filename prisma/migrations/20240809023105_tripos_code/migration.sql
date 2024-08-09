/*
  Warnings:

  - Added the required column `code` to the `Tripos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tripos" ADD COLUMN     "code" TEXT NOT NULL;
