import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cron from "node-cron";
import { checkScheduledTranslationsAndNotify } from "./telegram";
import os from "os";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
      port,
    "0.0.0.0",
    () => {
      log(`serving on port ${port}`);
      
      // Get local network IP addresses for mobile preview
      const networkInterfaces = os.networkInterfaces();
      const addresses: string[] = [];
      
      for (const interfaceName of Object.keys(networkInterfaces)) {
        const interfaces = networkInterfaces[interfaceName];
        if (!interfaces) continue;
        
        for (const iface of interfaces) {
          // Skip internal (loopback) and non-IPv4 addresses
          // Check both 'IPv4' (Node.js < 18) and 4 (Node.js >= 18)
          const family = String(iface.family);
          const isIPv4 = family === "IPv4" || family === "4";
          if (isIPv4 && !iface.internal) {
            addresses.push(iface.address);
          }
        }
      }
      
      if (addresses.length > 0) {
        log("", "network");
        log("📱 Mobile preview available at:", "network");
        addresses.forEach((addr) => {
          log(`   http://${addr}:${port}`, "network");
        });
        log("", "network");
      } else {
        log("⚠️  No network interfaces found for mobile preview", "network");
      }
      
      // Run every minute so scheduled items transition promptly from "План" -> "История".
      cron.schedule("* * * * *", async () => {
        log("Checking scheduled translations for notifications...", "cron");
        await checkScheduledTranslationsAndNotify();
      });
      log("Scheduled notification check cron job started (every minute)", "cron");
    },
  );
})();
