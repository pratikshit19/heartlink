import http2 from "http2";
import fs from "fs";
import { SignJWT, importPKCS8 } from "jose";

export interface ApnsPayload {
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  interactionId?: number;
  actionType?: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generate a JWT authorization token for APNs using ES256
 */
async function getApnsToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Reuse the token if it's still valid (APNs JWT tokens are valid for up to 1 hour, we refresh every 45 mins)
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const keyPath = process.env.APNS_KEY_PATH;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!keyId || !teamId) {
    throw new Error("Missing APNS_KEY_ID or APNS_TEAM_ID in environment variables");
  }

  let privateKeyPEM = process.env.APNS_PRIVATE_KEY;

  if (!privateKeyPEM) {
    if (!keyPath) {
      throw new Error("Must provide either APNS_PRIVATE_KEY or APNS_KEY_PATH");
    }
    privateKeyPEM = await fs.promises.readFile(keyPath, "utf8");
  }

  try {
    const ecPrivateKey = await importPKCS8(privateKeyPEM, "ES256");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .sign(ecPrivateKey);

    cachedToken = token;
    tokenExpiresAt = now + 45 * 60; // Refresh after 45 minutes
    return token;
  } catch (error) {
    console.error("[APNs] Failed to sign JWT token:", error);
    throw error;
  }
}

/**
 * Send a push notification payload to a specific APNs device token
 */
export async function sendApnsNotification(
  deviceToken: string,
  payload: ApnsPayload
): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";
  const host = isProduction ? "api.push.apple.com" : "api.development.push.apple.com";
  const topic = process.env.APNS_TOPIC || "com.heartlink";

  try {
    const token = await getApnsToken();

    // Map the payload to Apple APNs specification
    const apnsPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: payload.sound || "default",
        badge: payload.badge !== undefined ? payload.badge : 1,
        // Category enables custom actions on iOS
        category: payload.actionType === "follow_up" ? "FOLLOW_UP" : (payload.actionType === "reminder" ? "REMINDER" : undefined),
      },
      interactionId: payload.interactionId,
      actionType: payload.actionType,
    };

    return new Promise((resolve) => {
      // Connect using HTTP/2
      const client = http2.connect(`https://${host}:443`);

      client.on("error", (err) => {
        console.error("[APNs] Client connection error:", err);
        resolve(false);
      });

      const body = JSON.stringify(apnsPayload);
      const headers = {
        ":method": "POST",
        ":path": `/3/device/${deviceToken}`,
        "authorization": `bearer ${token}`,
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      };

      const req = client.request(headers);

      let responseData = "";
      req.on("data", (chunk) => {
        responseData += chunk;
      });

      req.on("response", (headers) => {
        const status = headers[":status"];
        
        req.on("end", () => {
          client.close();

          if (status === 200) {
            console.log(`[APNs] Successfully sent notification to token ${deviceToken.substring(0, 8)}...`);
            resolve(true);
          } else {
            console.error(`[APNs] Failed to send notification. Status: ${status}, Response: ${responseData}`);
            resolve(false);
          }
        });
      });

      req.on("error", (err) => {
        console.error("[APNs] Stream error:", err);
        client.close();
        resolve(false);
      });

      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error("[APNs] Failed to send notification:", error);
    return false;
  }
}
