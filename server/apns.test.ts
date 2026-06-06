import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sendPushNotification } from "./_core/pushNotifications";
import * as db from "./db";

vi.mock("./db", () => ({
  getUserPushTokens: vi.fn(),
  logNotification: vi.fn(),
}));

describe("pushNotifications integration tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.mocked(db.getUserPushTokens).mockReset();
    vi.mocked(db.logNotification).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return false if no push tokens are registered for the user", async () => {
    vi.mocked(db.getUserPushTokens).mockResolvedValue([]);
    const success = await sendPushNotification(1, 1, { title: "Test", body: "Hello" });
    expect(success).toBe(false);
  });

  it("should fall back to simulated notifications if APNs is not configured", async () => {
    vi.mocked(db.getUserPushTokens).mockResolvedValue([
      { id: 1, userId: 1, deviceToken: "dummy-ios-token", deviceType: "ios", isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
    vi.mocked(db.logNotification).mockResolvedValue({} as any);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const success = await sendPushNotification(1, 1, { title: "Test Title", body: "Test Body" });

    expect(success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Push] Simulated notification sent to ios token dummy-io..."),
      expect.any(Object)
    );
    expect(db.logNotification).toHaveBeenCalledWith(1, "Test Title", "Test Body", undefined);

    consoleSpy.mockRestore();
  });
});
