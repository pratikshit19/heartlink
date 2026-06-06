import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique user identifier. Stores the user's email address (repurposed from Manus openId). */
  openId: varchar("openId", { length: 320 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Bcrypt hash of the user's password. Null for OAuth-only accounts. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Relationship profile table - stores information about the user's relationship
 */
export const relationships = mysqlTable("relationships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  partnerName: varchar("partnerName", { length: 255 }).notNull(),
  anniversaryDate: timestamp("anniversaryDate").notNull(),
  loveLanguage: varchar("loveLanguage", { length: 50 }).notNull(), // acts_of_service, quality_time, physical_touch, words_of_affirmation, receiving_gifts
  relationshipGoals: text("relationshipGoals"),
  profileCompleted: boolean("profileCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

/**
 * Relationship health check-ins - daily mood and feeling tracking
 */
export const healthCheckIns = mysqlTable("healthCheckIns", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  mood: varchar("mood", { length: 50 }).notNull(), // very_sad, sad, neutral, happy, very_happy
  feeling: text("feeling"), // free-form text about how they're feeling
  connectionScore: int("connectionScore").notNull(), // 1-10 scale
  notes: text("notes"),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HealthCheckIn = typeof healthCheckIns.$inferSelect;
export type InsertHealthCheckIn = typeof healthCheckIns.$inferInsert;

/**
 * Important dates and reminders - anniversaries, birthdays, milestones
 */
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reminderDate: timestamp("reminderDate").notNull(),
  reminderType: varchar("reminderType", { length: 50 }).notNull(), // anniversary, birthday, milestone, custom
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringPattern: varchar("recurringPattern", { length: 50 }), // yearly, monthly, weekly
  notified: boolean("notified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

/**
 * Chat messages - conversation history with AI therapist
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Gesture suggestions - personalized ideas for the couple
 */
export const gestureSuggestions = mysqlTable("gestureSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  suggestion: text("suggestion").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // date_night, surprise_note, act_of_kindness, gift_idea, experience
  isFavorited: boolean("isFavorited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GestureSuggestion = typeof gestureSuggestions.$inferSelect;
export type InsertGestureSuggestion = typeof gestureSuggestions.$inferInsert;

/**
 * Conversation starters and relationship tips
 */
export const conversationStarters = mysqlTable("conversationStarters", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  prompt: text("prompt").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // deep_talk, fun_question, gratitude, future_planning, intimacy
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationStarter = typeof conversationStarters.$inferSelect;
export type InsertConversationStarter = typeof conversationStarters.$inferInsert;

// Relations
export const userRelations = relations(users, ({ many }) => ({
  relationships: many(relationships),
}));



export const healthCheckInRelations = relations(healthCheckIns, ({ one }) => ({
  relationship: one(relationships, {
    fields: [healthCheckIns.relationshipId],
    references: [relationships.id],
  }),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  relationship: one(relationships, {
    fields: [reminders.relationshipId],
    references: [relationships.id],
  }),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  relationship: one(relationships, {
    fields: [chatMessages.relationshipId],
    references: [relationships.id],
  }),
}));

export const gestureSuggestionRelations = relations(gestureSuggestions, ({ one }) => ({
  relationship: one(relationships, {
    fields: [gestureSuggestions.relationshipId],
    references: [relationships.id],
  }),
}));

export const conversationStarterRelations = relations(conversationStarters, ({ one }) => ({
  relationship: one(relationships, {
    fields: [conversationStarters.relationshipId],
    references: [relationships.id],
  }),
}));

/**
 * Agent interactions - tracks follow-ups and user responses
 */
export const agentInteractions = mysqlTable("agentInteractions", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  interactionType: varchar("interactionType", { length: 50 }).notNull(), // follow_up, check_in, reminder, suggestion
  question: text("question").notNull(),
  userResponse: text("userResponse"),
  agentInsight: text("agentInsight"), // AI-generated insight from response
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative, concerned
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentInteraction = typeof agentInteractions.$inferSelect;
export type InsertAgentInteraction = typeof agentInteractions.$inferInsert;

/**
 * Relationship history - tracks mistakes, patterns, and challenges
 */
export const relationshipHistory = mysqlTable("relationshipHistory", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  eventType: varchar("eventType", { length: 50 }).notNull(), // mistake, challenge, conflict, breakthrough, pattern
  description: text("description").notNull(),
  impact: varchar("impact", { length: 20 }), // high, medium, low
  lesson: text("lesson"), // what was learned
  preventionTip: text("preventionTip"), // how to avoid repeating
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RelationshipHistory = typeof relationshipHistory.$inferSelect;
export type InsertRelationshipHistory = typeof relationshipHistory.$inferInsert;

/**
 * Notification schedule - custom timing for agent follow-ups
 */
export const notificationSchedules = mysqlTable("notificationSchedules", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  dayOfWeek: varchar("dayOfWeek", { length: 20 }), // monday, tuesday, etc. or 'daily'
  timeOfDay: varchar("timeOfDay", { length: 20 }).notNull(), // morning, lunch, afternoon, evening, night
  hour: int("hour"), // 0-23
  minute: int("minute"), // 0-59
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type InsertNotificationSchedule = typeof notificationSchedules.$inferInsert;

/**
 * Quick replies - predefined responses for notifications
 */
export const quickReplies = mysqlTable("quickReplies", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  replyText: text("replyText").notNull(),
  replyType: varchar("replyType", { length: 50 }).notNull(), // yes, no, later, done, need_help
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = typeof quickReplies.$inferInsert;

/**
 * Agent memory - learned patterns and insights
 */
export const agentMemory = mysqlTable("agentMemory", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  memoryType: varchar("memoryType", { length: 50 }).notNull(), // pattern, preference, mistake, strength, opportunity
  content: text("content").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  lastUsed: timestamp("lastUsed"),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentMemory = typeof agentMemory.$inferSelect;
export type InsertAgentMemory = typeof agentMemory.$inferInsert;

/**
 * Push notification tokens - for iOS push notifications
 */
export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deviceToken: varchar("deviceToken", { length: 255 }).notNull().unique(),
  deviceType: varchar("deviceType", { length: 20 }).notNull(), // ios, android, web
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

/**
 * Notification history - tracks sent notifications
 */
export const notificationHistory = mysqlTable("notificationHistory", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: int("relationshipId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  actionType: varchar("actionType", { length: 50 }), // follow_up, reminder, suggestion, check_in
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
  respondedAt: timestamp("respondedAt"),
  response: text("response"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationHistoryRecord = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;

// Relations for new tables
export const agentInteractionRelations = relations(agentInteractions, ({ one }) => ({
  relationship: one(relationships, {
    fields: [agentInteractions.relationshipId],
    references: [relationships.id],
  }),
}));

export const relationshipHistoryRelations = relations(relationshipHistory, ({ one }) => ({
  relationship: one(relationships, {
    fields: [relationshipHistory.relationshipId],
    references: [relationships.id],
  }),
}));

export const notificationScheduleRelations = relations(notificationSchedules, ({ one }) => ({
  relationship: one(relationships, {
    fields: [notificationSchedules.relationshipId],
    references: [relationships.id],
  }),
}));

export const quickReplyRelations = relations(quickReplies, ({ one }) => ({
  relationship: one(relationships, {
    fields: [quickReplies.relationshipId],
    references: [relationships.id],
  }),
}));

export const agentMemoryRelations = relations(agentMemory, ({ one }) => ({
  relationship: one(relationships, {
    fields: [agentMemory.relationshipId],
    references: [relationships.id],
  }),
}));

export const pushTokenRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, {
    fields: [pushTokens.userId],
    references: [users.id],
  }),
}));

export const notificationHistoryRelations = relations(notificationHistory, ({ one }) => ({
  relationship: one(relationships, {
    fields: [notificationHistory.relationshipId],
    references: [relationships.id],
  }),
}));

export const relationshipRelationsUpdated = relations(relationships, ({ one, many }) => ({
  user: one(users, {
    fields: [relationships.userId],
    references: [users.id],
  }),
  healthCheckIns: many(healthCheckIns),
  reminders: many(reminders),
  chatMessages: many(chatMessages),
  gestureSuggestions: many(gestureSuggestions),
  conversationStarters: many(conversationStarters),
  agentInteractions: many(agentInteractions),
  relationshipHistory: many(relationshipHistory),
  notificationSchedules: many(notificationSchedules),
  quickReplies: many(quickReplies),
  agentMemory: many(agentMemory),
  notificationHistory: many(notificationHistory),
}));