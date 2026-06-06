import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 12;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function registerAuthRoutes(app: Express) {
  // ── Sign Up ──────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    try {
      // Check if email already registered
      const existing = await db.getUserByOpenId(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const normalizedEmail = email.toLowerCase();
      const displayName = (typeof name === "string" && name.trim()) ? name.trim() : normalizedEmail.split("@")[0];

      // Determine role — first user with adminEmail env var becomes admin
      const role = (ENV.adminEmail && normalizedEmail === ENV.adminEmail.toLowerCase()) ? "admin" : "user";

      await db.upsertUser({
        openId: normalizedEmail,
        name: displayName,
        email: normalizedEmail,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
        role,
      });

      const sessionToken = await sdk.createSessionToken(normalizedEmail, {
        name: displayName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ success: true, name: displayName });
    } catch (error) {
      console.error("[Auth] Signup failed", error);
      return res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  // ── Sign In ──────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const normalizedEmail = email.toLowerCase();
      const user = await db.getUserByOpenId(normalizedEmail);

      if (!user || !user.passwordHash) {
        // Constant time to prevent user enumeration
        await bcrypt.hash("dummy-prevent-timing-attack", BCRYPT_ROUNDS);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last signed in
      await db.upsertUser({ openId: normalizedEmail, lastSignedIn: new Date() });

      const sessionToken = await sdk.createSessionToken(normalizedEmail, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ success: true, name: user.name });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // ── Sign Out ─────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return res.json({ success: true });
  });

  // ── OAuth Callback (kept for backwards compat, now unused) ───────────────
  // Remove this block if you no longer need Manus OAuth
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/login?error=oauth_not_supported");
  });
}
