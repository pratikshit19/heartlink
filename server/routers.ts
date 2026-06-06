import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  relationship: router({
    getOrCreate: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateRelationship(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          partnerName: z.string().min(1),
          anniversaryDate: z.date(),
          loveLanguage: z.enum(["acts_of_service", "quality_time", "physical_touch", "words_of_affirmation", "receiving_gifts"]),
          relationshipGoals: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const relationship = await db.createRelationship(
          ctx.user.id,
          input.partnerName,
          input.anniversaryDate,
          input.loveLanguage,
          input.relationshipGoals
        );
        
        // Initialize default notification schedule
        if (relationship) {
          const { initializeDefaultSchedule } = await import("./_core/scheduler");
          await initializeDefaultSchedule(relationship.id);
        }
        
        return relationship;
      }),
    update: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          updates: z.object({
            partnerName: z.string().optional(),
            loveLanguage: z.string().optional(),
            relationshipGoals: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateRelationshipProfile(input.relationshipId, input.updates);
      }),
  }),

  healthCheckIn: router({
    create: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          mood: z.enum(["very_sad", "sad", "neutral", "happy", "very_happy"]),
          connectionScore: z.number().min(1).max(10),
          feeling: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.createHealthCheckIn(
          input.relationshipId,
          input.mood,
          input.connectionScore,
          input.feeling,
          input.notes
        );
      }),
    getHistory: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getHealthCheckIns(input.relationshipId);
      }),
    getScore: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.calculateHealthScore(input.relationshipId);
      }),
  }),

  reminders: router({
    create: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          title: z.string().min(1),
          reminderDate: z.date(),
          reminderType: z.enum(["anniversary", "birthday", "milestone", "custom"]),
          description: z.string().optional(),
          isRecurring: z.boolean().optional(),
          recurringPattern: z.enum(["yearly", "monthly", "weekly"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.createReminder(
          input.relationshipId,
          input.title,
          input.reminderDate,
          input.reminderType,
          input.description,
          input.isRecurring,
          input.recurringPattern
        );
      }),
    getAll: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getReminders(input.relationshipId);
      }),
    getUpcoming: protectedProcedure
      .input(z.object({ relationshipId: z.number(), daysAhead: z.number().default(30) }))
      .query(async ({ input }) => {
        return db.getUpcomingReminders(input.relationshipId, input.daysAhead);
      }),
  }),

  chat: router({
    sendMessage: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          message: z.string().min(1),
          partnerName: z.string(),
          loveLanguage: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const history = await db.getChatHistory(input.relationshipId, 10);
        const messages = history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        messages.push({
          role: "user",
          content: input.message,
        });

        const systemPrompt = `You are a compassionate relationship advisor and therapist for ${input.partnerName}'s partner.
Your role is to provide empathetic, insightful guidance on relationship matters.
Consider their love language: ${input.loveLanguage}.
Be warm, understanding, and practical in your advice.`;

        const response = await invokeLLM({
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        });

        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof messageContent === "string" ? messageContent : "I understand. Tell me more about how you're feeling.";

        await db.saveChatMessage(input.relationshipId, "user", input.message);
        await db.saveChatMessage(input.relationshipId, "assistant", assistantMessage);

        return { message: assistantMessage };
      }),
    getHistory: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getChatHistory(input.relationshipId);
      }),
  }),

  gestures: router({
    generate: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          partnerName: z.string(),
          loveLanguage: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const loveLanguageGuides: Record<string, string> = {
          quality_time: "Plan activities where you can spend uninterrupted time together.",
          acts_of_service: "Do something helpful or take a task off their plate.",
          words_of_affirmation: "Express appreciation and compliments.",
          physical_touch: "Show affection through hugs, holding hands, or cuddling.",
          receiving_gifts: "Surprise them with a thoughtful gift.",
        };

        const prompt = `Generate a cute, romantic gesture idea for ${input.partnerName}. ${loveLanguageGuides[input.loveLanguage] || ""}
Make it specific, actionable, and heartfelt. Keep it to 1-2 sentences. Respond with just the idea, nothing else.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const suggestionContent = response.choices[0]?.message?.content;
        const suggestion = typeof suggestionContent === 'string' ? suggestionContent : "Plan a special date night together.";

        let category = "act_of_kindness";
        if (suggestion.toLowerCase().includes("date")) category = "date_night";
        if (suggestion.toLowerCase().includes("note")) category = "surprise_note";
        if (suggestion.toLowerCase().includes("gift")) category = "gift_idea";
        if (suggestion.toLowerCase().includes("experience")) category = "experience";

        return db.createGestureSuggestion(input.relationshipId, suggestion, category);
      }),
    getRecent: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getGestureSuggestions(input.relationshipId, 5);
      }),
  }),

  conversationStarters: router({
    generate: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          partnerName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const categories = ["deep_talk", "fun_question", "gratitude", "future_planning", "intimacy"];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        const categoryPrompts: Record<string, string> = {
          deep_talk: "Generate a thoughtful, deep conversation starter for couples to explore their feelings and dreams together.",
          fun_question: "Generate a fun, lighthearted conversation starter to make the couple laugh and enjoy each other's company.",
          gratitude: "Generate a conversation starter focused on appreciation and gratitude for each other.",
          future_planning: "Generate a conversation starter about their future together, goals, and dreams.",
          intimacy: "Generate a conversation starter to deepen emotional or physical intimacy and connection.",
        };

        const prompt = `${categoryPrompts[randomCategory]} Keep it concise (1-2 sentences) and make it specific to a couple. Respond with just the question, nothing else.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const starterContent = response.choices[0]?.message?.content;
        const starter = typeof starterContent === 'string' ? starterContent : "What's one thing you appreciate about me that you haven't told me recently?";

        return db.createConversationStarter(input.relationshipId, starter, randomCategory);
      }),
    getRecent: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getConversationStarters(input.relationshipId, 5);
      }),
  }),

  agent: router({
    recordHistory: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          eventType: z.enum(["mistake", "challenge", "conflict", "breakthrough", "pattern"]),
          description: z.string().min(1),
          impact: z.enum(["high", "medium", "low"]).optional(),
          lesson: z.string().optional(),
          preventionTip: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.addRelationshipHistory(
          input.relationshipId,
          input.eventType,
          input.description,
          input.impact,
          input.lesson,
          input.preventionTip
        );
      }),
    getHistory: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getRelationshipHistory(input.relationshipId);
      }),
    recordInteraction: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          interactionId: z.number(),
          userResponse: z.string(),
          sentiment: z.enum(["positive", "neutral", "negative", "concerned"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateAgentInteractionResponse(
          input.interactionId,
          input.userResponse,
          "",
          input.sentiment
        );
        return { success: true };
      }),
    getMemory: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input }) => {
        return db.getAgentMemory(input.relationshipId);
      }),
    registerDeviceToken: protectedProcedure
      .input(
        z.object({
          deviceToken: z.string(),
          deviceType: z.string().default("ios"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { registerDeviceToken } = await import("./_core/pushNotifications");
        const success = await registerDeviceToken(ctx.user.id, input.deviceToken, input.deviceType);
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
