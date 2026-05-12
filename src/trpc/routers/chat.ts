import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateText } from "ai";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { db as dbInstance } from "@/db";
import { chatMessageTable, chatTable } from "@/db/schema/chat";
import { usersTable } from "@/db/schema/user";
import { createTRPCRouter, protectedProcedure } from "../init";

const zChatId = z.string().uuid();

async function resolveUserId(db: typeof dbInstance, clerkId: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
    columns: { id: true }
  });
  if (!user)
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  return user.id;
}

export const chatRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = await resolveUserId(ctx.db, ctx.userId);
    return ctx.db.query.chatTable.findMany({
      where: eq(chatTable.userId, userId),
      orderBy: desc(chatTable.updatedAt),
      columns: { id: true, title: true, updatedAt: true }
    });
  }),

  getById: protectedProcedure
    .input(z.object({ chatId: zChatId }))
    .query(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      const chat = await ctx.db.query.chatTable.findFirst({
        where: and(
          eq(chatTable.id, input.chatId),
          eq(chatTable.userId, userId)
        ),
        with: { messages: { orderBy: chatMessageTable.createdAt } }
      });
      return chat ?? null;
    }),

  create: protectedProcedure
    .input(z.object({ chatId: zChatId }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      await ctx.db.insert(chatTable).values({
        id: input.chatId,
        userId
      });
      return { id: input.chatId };
    }),

  saveMessages: protectedProcedure
    .input(
      z.object({
        chatId: zChatId,
        messages: z
          .array(
            z.object({
              id: z.string().min(1),
              role: z.enum(["user", "assistant"]),
              parts: z.array(z.record(z.unknown()))
            })
          )
          .min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      const chat = await ctx.db.query.chatTable.findFirst({
        where: and(
          eq(chatTable.id, input.chatId),
          eq(chatTable.userId, userId)
        ),
        columns: { id: true }
      });
      if (!chat) return;

      await ctx.db
        .insert(chatMessageTable)
        .values(
          input.messages.map((msg) => ({
            id: msg.id,
            chatId: input.chatId,
            role: msg.role,
            parts: msg.parts
          }))
        )
        .onConflictDoUpdate({
          target: chatMessageTable.id,
          set: { parts: sql`excluded.parts` }
        });

      await ctx.db
        .update(chatTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatTable.id, input.chatId));
    }),

  delete: protectedProcedure
    .input(z.object({ chatId: zChatId }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);
      await ctx.db
        .delete(chatTable)
        .where(
          and(eq(chatTable.id, input.chatId), eq(chatTable.userId, userId))
        );
    }),

  generateTitle: protectedProcedure
    .input(
      z.object({
        chatId: zChatId,
        firstUserMessage: z.string().max(500),
        firstAssistantMessage: z.string().max(500)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.db, ctx.userId);

      const { text: title } = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "Generate a very short title (3-6 words) for this chat conversation. Return only the title, no quotes or punctuation.",
        prompt: `User: ${input.firstUserMessage}\nAssistant: ${input.firstAssistantMessage}`
      });

      const trimmed = title.trim().slice(0, 255);

      await ctx.db
        .update(chatTable)
        .set({ title: trimmed })
        .where(
          and(eq(chatTable.id, input.chatId), eq(chatTable.userId, userId))
        );

      return { title: trimmed };
    })
});
