import * as db from "../db";

export interface PushNotificationPayload {
  title: string;
  body: string;
  actionType?: string;
  interactionId?: number;
  quickActions?: Array<{
    id: string;
    title: string;
    authenticationRequired?: boolean;
  }>;
}

import { sendApnsNotification } from "./apnsService";

/**
 * Send a push notification to a user
 * In production, this would integrate with Apple Push Notification (APNs) service
 */
export async function sendPushNotification(
  userId: number,
  relationshipId: number,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Get user's push tokens
    const tokens = await db.getUserPushTokens(userId);

    if (tokens.length === 0) {
      console.log("[Push] No push tokens found for user:", userId);
      return false;
    }

    // Log the notification
    await db.logNotification(relationshipId, payload.title, payload.body, payload.actionType);

    const hasApnsConfig = !!(
      process.env.APNS_KEY_ID &&
      process.env.APNS_TEAM_ID &&
      (process.env.APNS_PRIVATE_KEY || process.env.APNS_KEY_PATH)
    );

    let sentCount = 0;
    for (const token of tokens) {
      if (token.deviceType === "ios" && hasApnsConfig) {
        const success = await sendApnsNotification(token.deviceToken, {
          title: payload.title,
          body: payload.body,
          interactionId: payload.interactionId,
          actionType: payload.actionType,
        });
        if (success) sentCount++;
      } else {
        console.log(`[Push] Simulated notification sent to ${token.deviceType} token ${token.deviceToken.substring(0, 8)}...`, {
          title: payload.title,
          body: payload.body,
        });
        sentCount++;
      }
    }

    return sentCount > 0;
  } catch (error) {
    console.error("[Push] Failed to send notification:", error);
    return false;
  }
}

/**
 * Send a follow-up question as a notification
 */
export async function sendFollowUpNotification(
  userId: number,
  relationshipId: number,
  question: string,
  interactionId: number
): Promise<boolean> {
  return sendPushNotification(userId, relationshipId, {
    title: "Your Relationship Buddy",
    body: question,
    actionType: "follow_up",
    interactionId,
    quickActions: [
      { id: "respond", title: "Respond" },
      { id: "later", title: "Later" },
    ],
  });
}

/**
 * Send a reminder notification
 */
export async function sendReminderNotification(
  userId: number,
  relationshipId: number,
  reminder: string
): Promise<boolean> {
  return sendPushNotification(userId, relationshipId, {
    title: "Relationship Reminder",
    body: reminder,
    actionType: "reminder",
    quickActions: [
      { id: "done", title: "Done" },
      { id: "remind_later", title: "Remind Later" },
    ],
  });
}

/**
 * Send a mistake prevention notification
 */
export async function sendMistakePreventionNotification(
  userId: number,
  relationshipId: number,
  tip: string
): Promise<boolean> {
  return sendPushNotification(userId, relationshipId, {
    title: "Learning from the Past",
    body: tip,
    actionType: "suggestion",
    quickActions: [
      { id: "acknowledge", title: "Got it" },
      { id: "discuss", title: "Discuss" },
    ],
  });
}

/**
 * Handle a push notification response
 */
export async function handleNotificationResponse(
  notificationId: number,
  response: string
): Promise<void> {
  try {
    await db.recordNotificationResponse(notificationId, response);
  } catch (error) {
    console.error("[Push] Failed to handle notification response:", error);
  }
}

/**
 * Register a device token for push notifications
 */
export async function registerDeviceToken(
  userId: number,
  deviceToken: string,
  deviceType: string = "ios"
): Promise<boolean> {
  try {
    await db.savePushToken(userId, deviceToken, deviceType);
    console.log("[Push] Device token registered:", { userId, deviceType });
    return true;
  } catch (error) {
    console.error("[Push] Failed to register device token:", error);
    return false;
  }
}
