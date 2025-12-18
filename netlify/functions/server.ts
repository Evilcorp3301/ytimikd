// Netlify serverless function wrapper for Express app
import type { Handler } from "@netlify/functions";
import express, { type Express } from "express";
import { createServer } from "http";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

// Initialize Express app (singleton pattern)
let app: Express | null = null;
let httpServer: any = null;
let handlerInstance: any = null;

async function getApp(): Promise<Express> {
  if (app) return app;

  const expressApp = express();
  httpServer = createServer(expressApp);
  
  // Middleware
  expressApp.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  }));
  expressApp.use(express.urlencoded({ extended: false }));

  // Register routes
  await registerRoutes(httpServer, expressApp);

  // Error handler
  expressApp.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  app = expressApp;
  return app;
}

// Create serverless handler
export const handler: Handler = async (event, context) => {
  const expressApp = await getApp();
  
  // Create serverless handler on first call
  if (!handlerInstance) {
    handlerInstance = serverless(expressApp, {
      binary: ["image/*", "application/pdf"],
    });
  }

  return handlerInstance(event, context);
};

