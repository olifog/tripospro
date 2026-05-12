CREATE TABLE "course_year_paper_year" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_year_paper_year_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"courseYearId" integer,
	"paperYearId" integer
);
--> statement-breakpoint
CREATE TABLE "user_starred_course" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_starred_course_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_starred_course_userId_courseId_unique" UNIQUE("userId","courseId")
);
--> statement-breakpoint
CREATE TABLE "question_author" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "question_author_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"questionId" integer,
	"authorId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_question_flag" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_question_flag_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"questionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_year" DROP CONSTRAINT "course_year_paperYearId_paper_year_id_fk";
--> statement-breakpoint
ALTER TABLE "question" DROP CONSTRAINT "question_authorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "course_year_paper_year" ADD CONSTRAINT "course_year_paper_year_courseYearId_course_year_id_fk" FOREIGN KEY ("courseYearId") REFERENCES "public"."course_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_year_paper_year" ADD CONSTRAINT "course_year_paper_year_paperYearId_paper_year_id_fk" FOREIGN KEY ("paperYearId") REFERENCES "public"."paper_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_starred_course" ADD CONSTRAINT "user_starred_course_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_starred_course" ADD CONSTRAINT "user_starred_course_courseId_course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_author" ADD CONSTRAINT "question_author_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_author" ADD CONSTRAINT "question_author_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_flag" ADD CONSTRAINT "user_question_flag_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_flag" ADD CONSTRAINT "user_question_flag_questionId_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_year" DROP COLUMN "paperYearId";--> statement-breakpoint
ALTER TABLE "question" DROP COLUMN "authorId";