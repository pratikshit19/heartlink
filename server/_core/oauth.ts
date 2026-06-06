/**
 * oauth.ts — Legacy Manus OAuth routes.
 * Replaced by auth.ts (self-hosted email/password auth).
 * This file is intentionally empty; routes are registered in auth.ts.
 */
import type { Express } from "express";

/** @deprecated Use registerAuthRoutes from auth.ts instead */
export function registerOAuthRoutes(_app: Express) {
  // No-op: OAuth routes have been moved to auth.ts
}
