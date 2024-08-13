/*
  Warnings:

  - Added the required column `name` to the `Paper` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Paper" ADD COLUMN     "name" TEXT NOT NULL;
