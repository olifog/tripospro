CREATE TABLE "course" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_year_lecturer" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_year_lecturer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"courseYearId" integer,
	"lecturerId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_year" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_year_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"courseId" integer,
	"paperYearId" integer,
	"url" varchar(255) NOT NULL,
	"michaelmas" boolean DEFAULT false NOT NULL,
	"lent" boolean DEFAULT false NOT NULL,
	"easter" boolean DEFAULT false NOT NULL,
	"lectures" integer,
	"moodleId" varchar(255),
	"suggestedSupervisions" integer,
	"format" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "paper_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"triposId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_year" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "paper_year_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"paperId" integer,
	"url" varchar(255) NOT NULL,
	"triposPartYearId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"paperYearId" integer,
	"courseYearId" integer,
	"questionNumber" integer NOT NULL,
	"url" varchar(255) NOT NULL,
	"solutionUrl" varchar(255),
	"examinerComment" text,
	"authorId" integer,
	"minimumMark" integer,
	"maximumMark" integer,
	"medianMark" integer,
	"attempts" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tripos_part" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tripos_part_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"triposId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tripos_part_year" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tripos_part_year_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"triposPartId" integer,
	"candidates" integer,
	"starredFirsts" integer,
	"firsts" integer,
	"twoOnes" integer,
	"twoTwos" integer,
	"thirds" integer,
	"unclassed" integer,
	"withdrawn" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tripos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tripos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_question_answer" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_question_answer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"questionId" integer,
	"timeTaken" integer,
	"mark" integer,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"crsid" varchar(255),
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"picture" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_crsid_unique" UNIQUE("crsid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "course_year_lecturer" ADD CONSTRAINT "course_year_lecturer_courseYearId_course_year_id_fk" FOREIGN KEY ("courseYearId") REFERENCES "public"."course_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_year_lecturer" ADD CONSTRAINT "course_year_lecturer_lecturerId_users_id_fk" FOREIGN KEY ("lecturerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_year" ADD CONSTRAINT "course_year_courseId_course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_year" ADD CONSTRAINT "course_year_paperYearId_paper_year_id_fk" FOREIGN KEY ("paperYearId") REFERENCES "public"."paper_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper" ADD CONSTRAINT "paper_triposId_tripos_id_fk" FOREIGN KEY ("triposId") REFERENCES "public"."tripos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_year" ADD CONSTRAINT "paper_year_paperId_paper_id_fk" FOREIGN KEY ("paperId") REFERENCES "public"."paper"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_year" ADD CONSTRAINT "paper_year_triposPartYearId_tripos_part_year_id_fk" FOREIGN KEY ("triposPartYearId") REFERENCES "public"."tripos_part_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_paperYearId_paper_year_id_fk" FOREIGN KEY ("paperYearId") REFERENCES "public"."paper_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_courseYearId_course_year_id_fk" FOREIGN KEY ("courseYearId") REFERENCES "public"."course_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tripos_part" ADD CONSTRAINT "tripos_part_triposId_tripos_id_fk" FOREIGN KEY ("triposId") REFERENCES "public"."tripos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tripos_part_year" ADD CONSTRAINT "tripos_part_year_triposPartId_tripos_part_id_fk" FOREIGN KEY ("triposPartId") REFERENCES "public"."tripos_part"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_answer" ADD CONSTRAINT "user_question_answer_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_answer" ADD CONSTRAINT "user_question_answer_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;