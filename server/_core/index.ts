import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Periodic scheduled heartbeat — secured by CRON_SECRET env var
  app.post("/api/scheduled/heartbeat", async (req, res) => {
    try {
      const cronSecret = process.env.CRON_SECRET;
      const authHeader = req.headers.authorization ?? "";
      const providedSecret = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!cronSecret || providedSecret !== cronSecret) {
        return res.status(403).json({ error: "Unauthorized: Invalid cron secret" });
      }

      const { heartbeatJob } = await import("./heartbeat");
      await heartbeatJob();
      return res.json({ success: true });
    } catch (error) {
      console.error("[Heartbeat Endpoint] Failed:", error);
      return res.status(500).json({
        error: String(error),
        timestamp: Date.now(),
      });
    }
  });

  // Widget Status JSON API
  app.get("/api/widget/status", async (req, res) => {
    try {
      const { getDb, calculateHealthScore, getGestureSuggestions } = await import("../db");
      const database = await getDb();
      if (!database) {
        return res.json({ healthScore: 0, todayAction: "Database offline" });
      }

      const relationshipId = parseInt(req.query.relationshipId as string);
      if (isNaN(relationshipId)) {
        return res.status(400).json({ error: "Missing relationshipId" });
      }

      const score = await calculateHealthScore(relationshipId);
      const suggestions = await getGestureSuggestions(relationshipId, 1);
      const todayAction = suggestions.length > 0 ? suggestions[0].suggestion : "Do something thoughtful for your partner today!";

      return res.json({
        healthScore: score,
        todayAction
      });
    } catch (error) {
      console.error("[Widget API] Failed:", error);
      return res.status(500).json({
        healthScore: 0,
        todayAction: "Failed to load relationship status",
      });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
