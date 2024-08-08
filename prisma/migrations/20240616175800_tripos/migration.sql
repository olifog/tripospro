-- CreateTable
CREATE TABLE "Tripos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tripos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriposPart" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "triposId" INTEGER NOT NULL,

    CONSTRAINT "TriposPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseUrl" TEXT NOT NULL,
    "triposPartId" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseYear" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "year" TEXT NOT NULL,
    "courseYearUrl" TEXT NOT NULL,

    CONSTRAINT "CourseYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" SERIAL NOT NULL,
    "triposPartId" INTEGER NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperYear" (
    "id" SERIAL NOT NULL,
    "paperId" INTEGER NOT NULL,
    "year" TEXT NOT NULL,
    "paperYearUrl" TEXT NOT NULL,

    CONSTRAINT "PaperYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "paperYearId" INTEGER NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionUrl" TEXT NOT NULL,
    "solutionUrl" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TriposPart" ADD CONSTRAINT "TriposPart_triposId_fkey" FOREIGN KEY ("triposId") REFERENCES "Tripos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_triposPartId_fkey" FOREIGN KEY ("triposPartId") REFERENCES "TriposPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseYear" ADD CONSTRAINT "CourseYear_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_triposPartId_fkey" FOREIGN KEY ("triposPartId") REFERENCES "TriposPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperYear" ADD CONSTRAINT "PaperYear_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_paperYearId_fkey" FOREIGN KEY ("paperYearId") REFERENCES "PaperYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
