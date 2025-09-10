import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./auth";
import { registerTaskRoutes } from "./tasks";
import { registerProfileRoutes } from "./profiles";
import { registerProxyRoutes } from "./proxy";
import { registerSettingsRoutes } from "./settings";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register modular routes
  registerAuthRoutes(app);
  registerTaskRoutes(app);
  registerProfileRoutes(app);
  registerProxyRoutes(app);
  registerSettingsRoutes(app);

  const server = createServer(app);

  return server;
}

