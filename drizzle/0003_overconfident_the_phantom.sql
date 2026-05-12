CREATE TABLE "chat_message" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"chatId" varchar(36) NOT NULL,
	"role" varchar(20) NOT NULL,
	"parts" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_chat_idx" ON "chat_message" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "chat_user_updated_idx" ON "chat" USING btree ("userId","updatedAt");