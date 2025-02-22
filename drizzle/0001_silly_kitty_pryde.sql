CREATE TABLE "user_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"triposPartId" integer
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerkId" varchar(255);--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_triposPartId_tripos_part_id_fk" FOREIGN KEY ("triposPartId") REFERENCES "public"."tripos_part"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId");