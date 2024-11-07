/*
  Warnings:

  - A unique constraint covering the columns `[name,triposId]` on the table `TriposPart` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TriposPart_name_triposId_key" ON "TriposPart"("name", "triposId");
