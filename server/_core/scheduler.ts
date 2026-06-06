import * as db from "../db";
import { generateFollowUp, generateReminder, generateMistakePrevention } from "./agent";
import {
  sendFollowUpNotification,
  sendReminderNotification,
  sendMistakePreventionNotification,
} from "./pushNotifications";

/**
 * Get the current time period (morning, lunch, afternoon, evening, night)
 */
function getCurrentTimePeriod(): string {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

/**
 * Get the current day of week
 */
function getCurrentDayOfWeek(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

/**
 * Check if a schedule should trigger now
 */
function shouldTriggerNow(schedule: any): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check day of week
  if (schedule.dayOfWeek && schedule.dayOfWeek !== "daily") {
    const currentDay = getCurrentDayOfWeek();
    if (schedule.dayOfWeek !== currentDay) {
      return false;
    }
  }

  // Check time
  if (schedule.hour !== null && schedule.minute !== null) {
    // Exact time match (within 1 minute window)
    if (currentHour === schedule.hour && Math.abs(currentMinute - schedule.minute) <= 1) {
      return true;
    }
  }

  // Check time period
  const currentPeriod = getCurrentTimePeriod();
  if (schedule.timeOfDay === currentPeriod) {
    // Random chance within the time period to avoid all notifications at once
    return Math.random() < 0.1; // 10% chance per minute check
  }

  return false;
}

/**
 * Process scheduled notifications for a relationship
 */
export async function processScheduledNotifications(
  userId: number,
  relationshipId: number,
  partnerName: string,
  loveLanguage: string
): Promise<void> {
  try {
    // Get active schedules for this relationship
    const schedules = await db.getNotificationSchedules(relationshipId);

    for (const schedule of schedules) {
      if (!shouldTriggerNow(schedule)) {
        continue;
      }

      // Randomly choose between follow-up, reminder, and mistake prevention
      const choice = Math.random();

      if (choice < 0.4) {
        // Generate and send follow-up
        const followUp = await generateFollowUp(relationshipId, partnerName, loveLanguage);
        if (followUp) {
          const interaction = await db.createAgentInteraction(
            relationshipId,
            followUp.type,
            followUp.question
          );
          if (interaction) {
            await sendFollowUpNotification(userId, relationshipId, followUp.question, interaction.id);
          }
        }
      } else if (choice < 0.7) {
        // Generate and send reminder
        const reminder = await generateReminder(relationshipId, partnerName, loveLanguage);
        if (reminder) {
          await sendReminderNotification(userId, relationshipId, reminder.question);
        }
      } else {
        // Generate and send mistake prevention
        const mistakePrevention = await generateMistakePrevention(relationshipId, partnerName);
        if (mistakePrevention) {
          await sendMistakePreventionNotification(
            userId,
            relationshipId,
            mistakePrevention.question
          );
        }
      }
    }
  } catch (error) {
    console.error("[Scheduler] Failed to process notifications:", error);
  }
}

/**
 * Initialize default notification schedule for a new relationship
 */
export async function initializeDefaultSchedule(relationshipId: number): Promise<void> {
  try {
    // Create default schedules for different times of day
    const defaultSchedules = [
      { timeOfDay: "morning", hour: 8, minute: 0, dayOfWeek: "daily" },
      { timeOfDay: "lunch", hour: 12, minute: 30, dayOfWeek: "daily" },
      { timeOfDay: "evening", hour: 18, minute: 0, dayOfWeek: "daily" },
    ];

    for (const schedule of defaultSchedules) {
      await db.createNotificationSchedule(
        relationshipId,
        schedule.timeOfDay,
        schedule.dayOfWeek,
        schedule.hour,
        schedule.minute
      );
    }

    console.log("[Scheduler] Default schedule initialized for relationship:", relationshipId);
  } catch (error) {
    console.error("[Scheduler] Failed to initialize default schedule:", error);
  }
}

/**
 * Create a custom notification schedule
 */
export async function createCustomSchedule(
  relationshipId: number,
  timeOfDay: string,
  dayOfWeek?: string,
  hour?: number,
  minute?: number
): Promise<boolean> {
  try {
    await db.createNotificationSchedule(relationshipId, timeOfDay, dayOfWeek, hour, minute);
    return true;
  } catch (error) {
    console.error("[Scheduler] Failed to create custom schedule:", error);
    return false;
  }
}
