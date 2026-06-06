import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, relationships, healthCheckIns, reminders, chatMessages, gestureSuggestions, conversationStarters, agentInteractions, relationshipHistory, notificationSchedules, quickReplies, agentMemory, pushTokens, notificationHistory, Relationship, HealthCheckIn, Reminder, ChatMessage, GestureSuggestion, ConversationStarter, AgentInteraction, RelationshipHistory, NotificationSchedule, QuickReply, AgentMemory, PushToken, NotificationHistoryRecord } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (ENV.adminEmail && user.openId === ENV.adminEmail.toLowerCase()) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Convenience alias — looks up a user by their email (stored in openId column). */
export async function getUserByEmail(email: string) {
  return getUserByOpenId(email.toLowerCase());
}

// Relationship queries
export async function getOrCreateRelationship(userId: number): Promise<Relationship | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(relationships).where(eq(relationships.userId, userId)).limit(1);
  return existing.length > 0 ? existing[0] : null;
}

export async function createRelationship(userId: number, partnerName: string, anniversaryDate: Date, loveLanguage: string, relationshipGoals?: string): Promise<Relationship | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(relationships).values({
    userId,
    partnerName,
    anniversaryDate,
    loveLanguage,
    relationshipGoals: relationshipGoals || null,
    profileCompleted: true,
  });

  return getOrCreateRelationship(userId);
}

export async function updateRelationshipProfile(relationshipId: number, updates: Partial<Relationship>): Promise<Relationship | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(relationships).set(updates).where(eq(relationships.id, relationshipId));
  const result = await db.select().from(relationships).where(eq(relationships.id, relationshipId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Health check-in queries
export async function createHealthCheckIn(relationshipId: number, mood: string, connectionScore: number, feeling?: string, notes?: string): Promise<HealthCheckIn | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(healthCheckIns).values({
    relationshipId,
    mood,
    connectionScore,
    feeling: feeling || null,
    notes: notes || null,
  });

  const checkIns = await db.select().from(healthCheckIns).where(eq(healthCheckIns.relationshipId, relationshipId)).orderBy(desc(healthCheckIns.createdAt)).limit(1);
  return checkIns.length > 0 ? checkIns[0] : null;
}

export async function getHealthCheckIns(relationshipId: number, limit: number = 30): Promise<HealthCheckIn[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(healthCheckIns).where(eq(healthCheckIns.relationshipId, relationshipId)).orderBy(desc(healthCheckIns.createdAt)).limit(limit);
}

export async function calculateHealthScore(relationshipId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const checkIns = await db.select().from(healthCheckIns).where(eq(healthCheckIns.relationshipId, relationshipId)).orderBy(desc(healthCheckIns.createdAt)).limit(7);
  if (checkIns.length === 0) return 0;

  const avgScore = checkIns.reduce((sum, ci) => sum + ci.connectionScore, 0) / checkIns.length;
  return Math.round(avgScore * 10);
}

// Reminder queries
export async function createReminder(relationshipId: number, title: string, reminderDate: Date, reminderType: string, description?: string, isRecurring?: boolean, recurringPattern?: string): Promise<Reminder | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(reminders).values({
    relationshipId,
    title,
    reminderDate,
    reminderType,
    description: description || null,
    isRecurring: isRecurring || false,
    recurringPattern: recurringPattern || null,
  });

  const remindersResult = await db.select().from(reminders).where(eq(reminders.relationshipId, relationshipId)).orderBy(desc(reminders.createdAt)).limit(1);
  return remindersResult.length > 0 ? remindersResult[0] : null;
}

export async function getReminders(relationshipId: number): Promise<Reminder[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reminders).where(eq(reminders.relationshipId, relationshipId)).orderBy(reminders.reminderDate);
}

export async function getUpcomingReminders(relationshipId: number, daysAhead: number = 30): Promise<Reminder[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // Fetch all reminders and filter in memory for upcoming dates
  const allReminders = await db.select().from(reminders).where(eq(reminders.relationshipId, relationshipId)).orderBy(reminders.reminderDate);
  
  return allReminders.filter(r => {
    const reminderTime = new Date(r.reminderDate).getTime();
    return reminderTime >= now.getTime() && reminderTime <= futureDate.getTime();
  });
}

// Chat message queries
export async function saveChatMessage(relationshipId: number, role: string, content: string): Promise<ChatMessage | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(chatMessages).values({
    relationshipId,
    role,
    content,
  });

  const messages = await db.select().from(chatMessages).where(eq(chatMessages.relationshipId, relationshipId)).orderBy(desc(chatMessages.createdAt)).limit(1);
  return messages.length > 0 ? messages[0] : null;
}

export async function getChatHistory(relationshipId: number, limit: number = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chatMessages).where(eq(chatMessages.relationshipId, relationshipId)).orderBy(chatMessages.createdAt).limit(limit);
}

// Gesture suggestion queries
export async function createGestureSuggestion(relationshipId: number, suggestion: string, category: string): Promise<GestureSuggestion | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(gestureSuggestions).values({
    relationshipId,
    suggestion,
    category,
  });

  const suggestions = await db.select().from(gestureSuggestions).where(eq(gestureSuggestions.relationshipId, relationshipId)).orderBy(desc(gestureSuggestions.createdAt)).limit(1);
  return suggestions.length > 0 ? suggestions[0] : null;
}

export async function getGestureSuggestions(relationshipId: number, limit: number = 10): Promise<GestureSuggestion[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(gestureSuggestions).where(eq(gestureSuggestions.relationshipId, relationshipId)).orderBy(desc(gestureSuggestions.createdAt)).limit(limit);
}

// Conversation starter queries
export async function createConversationStarter(relationshipId: number, prompt: string, category: string): Promise<ConversationStarter | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(conversationStarters).values({
    relationshipId,
    prompt,
    category,
  });

  const starters = await db.select().from(conversationStarters).where(eq(conversationStarters.relationshipId, relationshipId)).orderBy(desc(conversationStarters.createdAt)).limit(1);
  return starters.length > 0 ? starters[0] : null;
}

export async function getConversationStarters(relationshipId: number, limit: number = 5): Promise<ConversationStarter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversationStarters).where(eq(conversationStarters.relationshipId, relationshipId)).orderBy(desc(conversationStarters.createdAt)).limit(limit);
}

// Agent interaction queries
export async function createAgentInteraction(relationshipId: number, interactionType: string, question: string): Promise<AgentInteraction | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(agentInteractions).values({
    relationshipId,
    interactionType,
    question,
  });

  const interactions = await db.select().from(agentInteractions).where(eq(agentInteractions.relationshipId, relationshipId)).orderBy(desc(agentInteractions.createdAt)).limit(1);
  return interactions.length > 0 ? interactions[0] : null;
}

export async function updateAgentInteractionResponse(interactionId: number, userResponse: string, agentInsight: string, sentiment: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(agentInteractions).set({
    userResponse,
    agentInsight,
    sentiment,
    respondedAt: new Date(),
  }).where(eq(agentInteractions.id, interactionId));
}

export async function getRecentAgentInteractions(relationshipId: number, limit: number = 20): Promise<AgentInteraction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agentInteractions).where(eq(agentInteractions.relationshipId, relationshipId)).orderBy(desc(agentInteractions.createdAt)).limit(limit);
}

// Relationship history queries
export async function addRelationshipHistory(relationshipId: number, eventType: string, description: string, impact?: string, lesson?: string, preventionTip?: string): Promise<RelationshipHistory | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(relationshipHistory).values({
    relationshipId,
    eventType,
    description,
    impact,
    lesson,
    preventionTip,
  });

  const histories = await db.select().from(relationshipHistory).where(eq(relationshipHistory.relationshipId, relationshipId)).orderBy(desc(relationshipHistory.createdAt)).limit(1);
  return histories.length > 0 ? histories[0] : null;
}

export async function getRelationshipHistory(relationshipId: number, limit: number = 50): Promise<RelationshipHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(relationshipHistory).where(eq(relationshipHistory.relationshipId, relationshipId)).orderBy(desc(relationshipHistory.createdAt)).limit(limit);
}

export async function getMistakes(relationshipId: number): Promise<RelationshipHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(relationshipHistory).where(and(eq(relationshipHistory.relationshipId, relationshipId), eq(relationshipHistory.eventType, "mistake"))).orderBy(desc(relationshipHistory.createdAt));
}

// Notification schedule queries
export async function createNotificationSchedule(relationshipId: number, timeOfDay: string, dayOfWeek?: string, hour?: number, minute?: number): Promise<NotificationSchedule | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(notificationSchedules).values({
    relationshipId,
    timeOfDay,
    dayOfWeek,
    hour,
    minute,
  });

  const schedules = await db.select().from(notificationSchedules).where(eq(notificationSchedules.relationshipId, relationshipId)).orderBy(desc(notificationSchedules.createdAt)).limit(1);
  return schedules.length > 0 ? schedules[0] : null;
}

export async function getNotificationSchedules(relationshipId: number): Promise<NotificationSchedule[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notificationSchedules).where(and(eq(notificationSchedules.relationshipId, relationshipId), eq(notificationSchedules.isActive, true)));
}

// Agent memory queries
export async function saveAgentMemory(relationshipId: number, memoryType: string, content: string, confidence: number = 0.8): Promise<AgentMemory | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(agentMemory).values({
    relationshipId,
    memoryType,
    content,
    confidence: confidence.toString() as any,
  });

  const memories = await db.select().from(agentMemory).where(eq(agentMemory.relationshipId, relationshipId)).orderBy(desc(agentMemory.createdAt)).limit(1);
  return memories.length > 0 ? memories[0] : null;
}

export async function getAgentMemory(relationshipId: number, memoryType?: string): Promise<AgentMemory[]> {
  const db = await getDb();
  if (!db) return [];

  if (memoryType) {
    return db.select().from(agentMemory).where(and(eq(agentMemory.relationshipId, relationshipId), eq(agentMemory.memoryType, memoryType))).orderBy(desc(agentMemory.usageCount));
  }

  return db.select().from(agentMemory).where(eq(agentMemory.relationshipId, relationshipId)).orderBy(desc(agentMemory.usageCount));
}

// Push token queries
export async function savePushToken(userId: number, deviceToken: string, deviceType: string): Promise<PushToken | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(pushTokens).values({
    userId,
    deviceToken,
    deviceType,
  });

  const tokens = await db.select().from(pushTokens).where(eq(pushTokens.deviceToken, deviceToken)).limit(1);
  return tokens.length > 0 ? tokens[0] : null;
}

export async function getUserPushTokens(userId: number): Promise<PushToken[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
}

// Notification history queries
export async function logNotification(relationshipId: number, title: string, body: string, actionType?: string): Promise<NotificationHistoryRecord | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(notificationHistory).values({
    relationshipId,
    title,
    body,
    actionType,
  });

  const notifications = await db.select().from(notificationHistory).where(eq(notificationHistory.relationshipId, relationshipId)).orderBy(desc(notificationHistory.createdAt)).limit(1);
  return notifications.length > 0 ? notifications[0] : null;
}

export async function recordNotificationResponse(notificationId: number, response: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(notificationHistory).set({
    response,
    respondedAt: new Date(),
  }).where(eq(notificationHistory.id, notificationId));
}

export async function getNotificationHistory(relationshipId: number, limit: number = 50): Promise<NotificationHistoryRecord[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notificationHistory).where(eq(notificationHistory.relationshipId, relationshipId)).orderBy(desc(notificationHistory.createdAt)).limit(limit);
}
