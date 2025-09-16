var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/vite.ts
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import { URL } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const viteConfigPath = new URL("file://" + path.join(process.cwd(), "vite.config.ts"));
  const viteConfig = await import(viteConfigPath.toString());
  const vite = await createViteServer({
    ...viteConfig.default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      info(msg) {
        log(msg, "vite");
      },
      warn(msg) {
        log(msg, "vite");
      },
      error(msg) {
        log(msg, "vite");
      }
    },
    server: {
      middlewareMode: true,
      hmr: {
        server,
        port: 24678
      }
    }
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const staticPath = path.join(process.cwd(), "dist", "public");
  if (!fs.existsSync(staticPath)) {
    throw new Error(
      `Could not find the build directory: ${staticPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(staticPath));
  app2.use("*", (_, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// server/routes/index.ts
import { createServer } from "http";

// server/routes/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";
function registerAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        throw new Error("Admin credentials not configured");
      }
      if (username !== process.env.ADMIN_USERNAME || !await bcrypt.compare(password, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT secret not configured");
      }
      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      res.json({ token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// server/routes/tasks.ts
import * as fs5 from "fs";
import * as path7 from "path";

// server/services/storage.ts
var MemStorage = class {
  tasks;
  profiles;
  currentProfileId;
  currentTaskId;
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
    this.profiles = /* @__PURE__ */ new Map();
    this.currentProfileId = 1;
    this.currentTaskId = 1;
    this.initializeProfileCounter();
    this.initializeTaskCounter();
  }
  async initializeProfileCounter() {
    console.log(`Profile counter initialized, starting ID: ${this.currentProfileId}`);
  }
  async initializeTaskCounter() {
    console.log(`Task counter initialized, starting ID: ${this.currentTaskId}`);
  }
  // Task operations
  async getTasks() {
    return Array.from(this.tasks.values());
  }
  async getTask(id) {
    return this.tasks.get(id);
  }
  async createTask(insertTask) {
    const task = {
      id: insertTask.id,
      name: insertTask.name || "Untitled Task",
      description: insertTask.description || "",
      profileId: insertTask.profileId || 0,
      scriptId: insertTask.scriptId || 0,
      status: insertTask.status || "NEW",
      profile: typeof insertTask.profile === "string" ? JSON.parse(insertTask.profile) : insertTask.profile || null,
      script: typeof insertTask.script === "string" ? JSON.parse(insertTask.script) : insertTask.script || null,
      request: typeof insertTask.request === "string" ? JSON.parse(insertTask.request) : insertTask.request || null,
      response: typeof insertTask.response === "string" ? JSON.parse(insertTask.response) : insertTask.response || null,
      created: /* @__PURE__ */ new Date(),
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.tasks.set(task.id, task);
    return task;
  }
  async updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (!task) return void 0;
    if (updates.profile && typeof updates.profile === "string") {
      updates.profile = JSON.parse(updates.profile);
    }
    if (updates.script && typeof updates.script === "string") {
      updates.script = JSON.parse(updates.script);
    }
    if (updates.request && typeof updates.request === "string") {
      updates.request = JSON.parse(updates.request);
    }
    if (updates.response && typeof updates.response === "string") {
      updates.response = JSON.parse(updates.response);
    }
    const updatedTask = { ...task, ...updates, lastUpdated: /* @__PURE__ */ new Date() };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  async deleteTask(id) {
    return this.tasks.delete(id);
  }
  async clearAllTasks() {
    this.tasks.clear();
  }
  // Profile operations
  async getProfiles() {
    return Array.from(this.profiles.values());
  }
  async getProfileIds() {
    return Array.from(this.profiles.keys());
  }
  async getProfile(id) {
    return this.profiles.get(id);
  }
  async createProfile(insertProfile) {
    if (!insertProfile.id) {
      insertProfile.id = this.currentProfileId++;
    } else {
      if (this.currentProfileId <= insertProfile.id) {
        this.currentProfileId = insertProfile.id + 1;
      }
    }
    const profile = {
      id: parseInt(insertProfile.id.toString()),
      name: insertProfile.name,
      description: insertProfile.description || null,
      isHeadless: insertProfile.isHeadless || false,
      isIncognito: insertProfile.isIncognito || false,
      browser: insertProfile.browser || "chrome-windows",
      userAgent: insertProfile.userAgent || null,
      customUserAgent: insertProfile.customUserAgent || null,
      viewportWidth: insertProfile.viewportWidth || null,
      viewportHeight: insertProfile.viewportHeight || null,
      timezone: insertProfile.timezone || "UTC",
      language: insertProfile.language || "en-US",
      useProxy: insertProfile.useProxy || false,
      proxyType: insertProfile.proxyType || "http",
      proxyHost: insertProfile.proxyHost || null,
      proxyPort: insertProfile.proxyPort || null,
      proxyUsername: insertProfile.proxyUsername || null,
      proxyPassword: insertProfile.proxyPassword || null,
      customField: typeof insertProfile.customField === "string" ? JSON.parse(insertProfile.customField) : insertProfile.customField || {},
      status: "READY",
      created: /* @__PURE__ */ new Date(),
      lastUsed: null
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }
  async updateProfile(id, updates) {
    const profile = this.profiles.get(id);
    if (!profile) return void 0;
    if (updates.customField && typeof updates.customField === "string") {
      updates.customField = JSON.parse(updates.customField);
    }
    const updatedProfile = {
      ...profile,
      ...updates,
      lastUsed: updates.lastUsed || profile.lastUsed
    };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }
  async deleteProfile(id) {
    const profile = this.profiles.get(id);
    if (!profile) return false;
    return this.profiles.delete(id);
  }
};
var storage = new MemStorage();

// server/executions/execution.ts
import path3 from "path";
import proxyChain from "proxy-chain";
import { promises as fs2 } from "fs";
import { promisify } from "util";
import { exec, fork } from "child_process";

// server/config.ts
var config_exports = {};
__export(config_exports, {
  BROWSER_TYPE: () => BROWSER_TYPE,
  INTERVAL_OF_AUTO_RUN_PROFILE: () => INTERVAL_OF_AUTO_RUN_PROFILE,
  INTERVAL_OF_AUTO_RUN_TASK: () => INTERVAL_OF_AUTO_RUN_TASK,
  IS_AUTO_RUN_PROFILE: () => IS_AUTO_RUN_PROFILE,
  IS_AUTO_RUN_TASK: () => IS_AUTO_RUN_TASK,
  IS_TWITTER_CARRING: () => IS_TWITTER_CARRING,
  LOCAL_PROFILE: () => LOCAL_PROFILE,
  ORIGINAL_CWD: () => ORIGINAL_CWD,
  PARRALEL_RUNNING_PROFILE: () => PARRALEL_RUNNING_PROFILE,
  PARRALEL_RUNNING_TASK: () => PARRALEL_RUNNING_TASK,
  PATH_OF_CHROME_OTHER: () => PATH_OF_CHROME_OTHER,
  PATH_OF_CHROME_WIN32: () => PATH_OF_CHROME_WIN32,
  TASKS_PROFILE: () => TASKS_PROFILE,
  innitializeConfig: () => innitializeConfig,
  updateProfileSettings: () => updateProfileSettings,
  updateTaskSettings: () => updateTaskSettings
});
import * as path2 from "path";
var IS_AUTO_RUN_TASK = false;
var INTERVAL_OF_AUTO_RUN_TASK = 15;
var PARRALEL_RUNNING_TASK = 1;
var IS_AUTO_RUN_PROFILE = false;
var INTERVAL_OF_AUTO_RUN_PROFILE = 15;
var PARRALEL_RUNNING_PROFILE = 1;
var IS_TWITTER_CARRING = false;
var ORIGINAL_CWD = process.cwd();
var LOCAL_PROFILE = path2.join(ORIGINAL_CWD, "storage", "local");
var TASKS_PROFILE = path2.join(ORIGINAL_CWD, "storage", "tasks");
var PATH_OF_CHROME_WIN32 = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
var PATH_OF_CHROME_OTHER = "/usr/bin/chromium-browser";
var BROWSER_TYPE = "puppeteer";
function innitializeConfig() {
  console.log("Initializing config...");
  IS_AUTO_RUN_TASK = Boolean(process.env.IS_AUTO_RUN_TASK);
  const intervalTask = parseInt(process.env.INTERVAL_OF_AUTO_RUN_TASK || "");
  INTERVAL_OF_AUTO_RUN_TASK = !isNaN(intervalTask) && intervalTask > 0 ? intervalTask : 15;
  const parallelTask = parseInt(process.env.PARRALEL_RUNNING_TASK || "");
  PARRALEL_RUNNING_TASK = !isNaN(parallelTask) && parallelTask > 0 ? parallelTask : 1;
  IS_AUTO_RUN_PROFILE = Boolean(process.env.IS_AUTO_RUN_PROFILE);
  const intervalProfile = parseInt(process.env.INTERVAL_OF_AUTO_RUN_PROFILE || "");
  INTERVAL_OF_AUTO_RUN_PROFILE = !isNaN(intervalProfile) && intervalProfile > 0 ? intervalProfile : 15;
  const parallelProfile = parseInt(process.env.PARRALEL_RUNNING_PROFILE || "");
  PARRALEL_RUNNING_PROFILE = !isNaN(parallelProfile) && parallelProfile > 0 ? parallelProfile : 1;
  IS_TWITTER_CARRING = Boolean(process.env.IS_TWITTER_CARRING);
  console.log("Config initialized:", {
    IS_AUTO_RUN_TASK,
    INTERVAL_OF_AUTO_RUN_TASK,
    PARRALEL_RUNNING_TASK,
    IS_AUTO_RUN_PROFILE,
    INTERVAL_OF_AUTO_RUN_PROFILE,
    PARRALEL_RUNNING_PROFILE,
    IS_TWITTER_CARRING
  });
}
function updateTaskSettings(settings) {
  if (typeof settings.isAutoRunTask === "boolean") {
    IS_AUTO_RUN_TASK = settings.isAutoRunTask;
  }
  if (typeof settings.intervalOfAutoRunTask === "number" && settings.intervalOfAutoRunTask > 0) {
    INTERVAL_OF_AUTO_RUN_TASK = settings.intervalOfAutoRunTask;
  }
  if (typeof settings.parallelRunningTask === "number" && settings.parallelRunningTask > 0) {
    PARRALEL_RUNNING_TASK = settings.parallelRunningTask;
  }
}
function updateProfileSettings(settings) {
  if (typeof settings.isAutoRunProfile === "boolean") {
    IS_AUTO_RUN_PROFILE = settings.isAutoRunProfile;
  }
  if (typeof settings.intervalOfAutoRunProfile === "number" && settings.intervalOfAutoRunProfile > 0) {
    INTERVAL_OF_AUTO_RUN_PROFILE = settings.intervalOfAutoRunProfile;
  }
  if (typeof settings.parallelRunningProfile === "number" && settings.parallelRunningProfile > 0) {
    PARRALEL_RUNNING_PROFILE = settings.parallelRunningProfile;
  }
  if (typeof settings.isTwitterCarring === "boolean") {
    IS_TWITTER_CARRING = settings.isTwitterCarring;
  }
}

// server/services/websocket.ts
import { WebSocket, WebSocketServer } from "ws";

// shared/socket.ts
var WEB_SOCKET_PORT = 5011;

// server/services/websocket.ts
var logClients = /* @__PURE__ */ new Map();
var originalConsoleLog = console.log;
function broadcastLog(type, id, logMessage, logType = "info") {
  const key = `${type}-${id}`;
  const clients = logClients.get(key);
  if (!clients) {
    return;
  }
  if (clients && clients.size > 0) {
    const message = JSON.stringify({
      type,
      id,
      message: logMessage,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    let sentCount = 0;
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });
    if (sentCount === 0) {
      originalConsoleLog(`[WebSocket] Warning: No active clients for ${key}`);
    }
  }
}
var wss = null;
function initializeWebSocketServer() {
  if (wss) {
    console.log("WebSocket server already initialized");
    return wss;
  }
  wss = new WebSocketServer({ port: WEB_SOCKET_PORT });
  console.log(`WebSocket server started on port ${WEB_SOCKET_PORT}`);
  wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected for real-time logs");
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.id) {
          const key = `${data.type}-${data.id}`;
          if (!logClients.has(key)) {
            logClients.set(key, /* @__PURE__ */ new Set());
          }
          logClients.get(key).add(ws);
          console.log(`[WebSocket] Client subscribed to ${key}`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      logClients.forEach((clients, key) => {
        clients.delete(ws);
        if (clients.size === 0) {
          logClients.delete(key);
        }
        console.log(`WebSocket client with key ${key} disconnected`);
      });
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  return wss;
}

// server/executions/execution.ts
async function killChromeProcessesUsingProfile(profilePath) {
  try {
    const execAsync = promisify(exec);
    const command = process.platform === "win32" ? `wmic process where "commandline like '%${profilePath.replace(/\\/g, "\\\\")}%'" get processid` : `ps aux | grep -E "(chrome|chromium-browser|google-chrome)" | grep "${profilePath}" | awk '{print $2}'`;
    const { stdout } = await execAsync(command);
    let pids = [];
    if (process.platform === "win32") {
      pids = stdout.split("\n").slice(1).map((line) => line.trim()).filter(Boolean);
    } else {
      pids = stdout.trim().split("\n").filter(Boolean);
    }
    if (pids.length === 0) {
      console.log(`No Chrome processes found for profile: ${profilePath}`);
      return { killed: 0, message: "No Chrome processes found for this profile" };
    }
    let killedCount = 0;
    for (const pid of pids) {
      if (pid && pid !== "") {
        try {
          await execAsync(process.platform === "win32" ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`);
          console.log(`Killed Chrome process with PID: ${pid}`);
          killedCount++;
        } catch (error) {
          console.error(`Failed to kill process ${pid}:`, error);
        }
      }
    }
    return {
      killed: killedCount,
      message: `Successfully killed ${killedCount} Chrome process(es) for profile: ${profilePath}`
    };
  } catch (error) {
    console.error("Error killing Chrome processes:", error);
    return {
      killed: 0,
      message: `Error killing Chrome processes: ${error.message}`
    };
  }
}
async function killAllChromeProcesses() {
  try {
    const command = process.platform === "win32" ? "taskkill /F /IM chrome.exe /IM chromedriver.exe /IM chromium.exe" : 'pkill -f "(chrome|chromium-browser|google-chrome)"';
    const { stdout, stderr } = await promisify(exec)(command);
    if (stderr) {
      console.error("Error killing Chrome processes:", stderr);
      return { killed: 0, message: stderr };
    }
    console.log("Chrome processes killed:", stdout);
    return { killed: stdout.includes("terminated") ? 1 : 0 };
  } catch (error) {
    console.error("Error killing Chrome processes:", error);
    return { killed: 0, message: error.message };
  }
}
async function openChromeWithProfile(profilePath, profileConfig) {
  try {
    const execAsync = promisify(exec);
    await fs2.mkdir(profilePath, { recursive: true });
    const chromeExecutable = process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome";
    const chromeArgs = [
      `--user-data-dir="${profilePath}"`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection"
    ];
    if (profileConfig.isHeadless) {
      chromeArgs.push("--headless=new");
    }
    if (profileConfig.isIncognito) {
      chromeArgs.push("--incognito");
    }
    if (profileConfig.customUserAgent) {
      chromeArgs.push(`--user-agent="${profileConfig.customUserAgent}"`);
    }
    if (profileConfig.viewportWidth && profileConfig.viewportHeight) {
      chromeArgs.push(`--window-size=${profileConfig.viewportWidth},${profileConfig.viewportHeight}`);
    }
    if (profileConfig.useProxy && profileConfig.proxyHost && profileConfig.proxyPort) {
      const oldProxyUrl = `${profileConfig.proxyType}://${profileConfig.proxyUsername}:${profileConfig.proxyPassword}@${profileConfig.proxyHost}:${profileConfig.proxyPort}`;
      const proxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
      chromeArgs.push(`--proxy-server=${proxyUrl}`);
      if (profileConfig.proxyUsername && profileConfig.proxyPassword) {
        chromeArgs.push(`--proxy-auth=${profileConfig.proxyUsername}:${profileConfig.proxyPassword}`);
      }
    }
    const command = `"${chromeExecutable}" ${chromeArgs.join(" ")}`;
    console.log(`Opening Chrome with profile: ${profilePath}`);
    console.log(`Command: ${command}`);
    if (process.platform === "win32") {
      await execAsync(`start "" ${command}`, { windowsHide: true });
    } else {
      await execAsync(`nohup ${command} > /dev/null 2>&1 &`);
    }
    console.log(`Chrome browser opened successfully with profile: ${profilePath}`);
  } catch (error) {
    console.error("Error opening Chrome with profile:", error);
    throw new Error(`Failed to open Chrome browser: ${error.message}`);
  }
}
async function readProfileConfig(profileFolder, profile) {
  let profileConfig = { ...profile };
  const configPath = path3.isAbsolute(profileFolder) ? path3.join(profileFolder, "config.json") : path3.join(ORIGINAL_CWD, profileFolder, "config.json");
  try {
    const configContent = await fs2.readFile(configPath, "utf8");
    profileConfig = { ...profileConfig, ...JSON.parse(configContent) };
  } catch (configError) {
    console.warn(`Failed to read config.json: ${configError.message}`);
  }
  return profileConfig;
}
async function executeScript(config) {
  const name = config.type + "-" + config.type == "task" ? +config.taskId : config.profileId;
  try {
    console.log(`Killing Chrome processes using profile: ${config.profilePath}\\chrome-profile`);
    const killResult = await killChromeProcessesUsingProfile(path3.join(config.profilePath, "chrome-profile"));
    console.log(`Kill result: ${killResult.message}`);
    try {
      const absoluteProfilePath = path3.isAbsolute(config.profilePath) ? config.profilePath : path3.join(ORIGINAL_CWD, config.profilePath);
      const script = fork(path3.join(ORIGINAL_CWD, "server", "executions", "scriptRunner"));
      script.send({
        config,
        profilePath: absoluteProfilePath
      });
      const result = await new Promise((resolve2, reject) => {
        script.on("message", (message) => {
          if (message.type === "log") {
            const { type, id, message: logMessage, logType } = message.logData;
            broadcastLog(type, id, logMessage, logType);
            return;
          }
          if (message.success) {
            resolve2(message.result);
          } else {
            reject(new Error(message.error));
          }
        });
        script.on("error", (error) => {
          reject(error);
        });
        script.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Child process exited with code ${code}`));
          }
        });
      });
      return result;
    } catch (error) {
      console.log(`${name} Script execution error with: ${error}`);
      try {
        console.log(`${name} Browser closed after error`);
      } catch (closeError) {
        console.log(`${name} Error closing browser after script error: ${closeError}`);
      }
      return {
        status: "FAILED",
        message: `Script execution failed: ${error.message}`,
        duration: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        browserType: "puppeteer",
        profileId: config.profileId,
        profileName: config.profile.name,
        error: error.message
      };
    }
  } finally {
  }
}

// server/middlewares/logAndOuput.ts
import * as fs3 from "fs/promises";
import * as path5 from "path";

// server/middlewares/utils.ts
import path4 from "path";
async function isRunningTask(taskId) {
  const tasks = await storage.getTasks();
  return tasks.filter((task) => task.id === taskId && task.status === "RUNNING").length > 0;
}
async function isRunningProfileOfTask(profileId) {
  const tasks = await storage.getTasks();
  return tasks.filter((task) => task.profileId === profileId && task.status === "RUNNING").length > 0;
}
async function getRunningTaskCount() {
  const tasks = await storage.getTasks();
  return tasks.filter((task) => task.status === "RUNNING").length;
}
async function getRunningProfileCount() {
  const profiles = await storage.getProfiles();
  return profiles.filter((profile) => profile.status === "RUNNING").length;
}
async function getTaskPathFromTaskId(taskId) {
  try {
    const task = await storage.getTask(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return null;
    }
    if (task.profile.dedicatedProfileId) {
      return path4.join(LOCAL_PROFILE, task.profile.dedicatedProfileId.toString(), `task-${taskId}`);
    }
    if (task.profileId) {
      return path4.join(TASKS_PROFILE, task.profileId.toString(), `task-${taskId}`);
    }
    return null;
  } catch (error) {
    console.error(`Error getting task path for task ${taskId}:`, error);
    return null;
  }
}

// server/middlewares/logAndOuput.ts
async function getLog(req, res, isTask = false) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID parameter" });
      return;
    }
    let logContent;
    let logPath;
    if (isTask) {
      const taskPath = await getTaskPathFromTaskId(id) || "";
      logPath = path5.join(taskPath, "script.log");
    } else {
      const taskPath = path5.join(LOCAL_PROFILE, id.toString(), "local");
      logPath = path5.join(taskPath, "script.log");
    }
    try {
      logContent = await fs3.readFile(logPath, "utf8");
    } catch (error) {
      logContent = "No log available for this profile.";
    }
    res.json({ content: logContent });
  } catch (error) {
    console.error("Error reading log:", error);
    res.status(500).json({ error: "Failed to read log file" });
  }
}
async function getOutput(req, res, isTask = false) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID parameter" });
      return;
    }
    let outputPath;
    let files = [];
    if (isTask) {
      const taskPath = await getTaskPathFromTaskId(id) || "";
      outputPath = path5.join(taskPath, "output");
    } else {
      const taskPath = path5.join(LOCAL_PROFILE, id.toString(), "local");
      outputPath = path5.join(taskPath, "output");
    }
    if (files.length === 0) {
      try {
        const entries = await fs3.readdir(outputPath, { withFileTypes: true });
        files = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path5.join(outputPath, entry.name);
            const stats = await fs3.stat(fullPath);
            return {
              name: entry.name,
              size: stats.size,
              type: entry.isDirectory() ? "directory" : "file",
              extension: entry.isFile() ? path5.extname(entry.name).slice(1) : void 0,
              lastModified: stats.mtime.toISOString()
            };
          })
        );
      } catch (error) {
        files = [];
      }
    }
    res.json({
      path: outputPath,
      files
    });
  } catch (error) {
    console.error("Error reading output folder:", error);
    res.status(500).json({ error: "Failed to read output folder" });
  }
}
async function getOutputFile(req, res, isTask = false) {
  try {
    const id = parseInt(req.params.id);
    const filename = req.params.filename;
    if (isNaN(id) || !filename) {
      res.status(400).json({ error: "Invalid ID or filename parameter" });
      return;
    }
    let outputPath;
    if (isTask) {
      const taskPath = await getTaskPathFromTaskId(id) || "";
      outputPath = path5.join(taskPath, "output");
    } else {
      const profilePath = path5.join(LOCAL_PROFILE, id.toString(), "local");
      outputPath = path5.join(profilePath, "output");
    }
    const filePath = path5.join(outputPath, filename);
    const resolvedPath = path5.resolve(filePath);
    const resolvedOutputPath = path5.resolve(outputPath);
    if (!resolvedPath.startsWith(resolvedOutputPath)) {
      res.status(403).json({ error: "Access denied: Invalid file path" });
      return;
    }
    try {
      const stats = await fs3.stat(filePath);
      const fileExtension = path5.extname(filename).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
        ".json": "application/json",
        ".txt": "text/plain",
        ".log": "text/plain",
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript"
      };
      const contentType = mimeTypes[fileExtension] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Last-Modified", stats.mtime.toUTCString());
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("ETag", `"${stats.mtime.getTime()}-${stats.size}"`);
      console.log(`Serving file: ${filename} for ${isTask ? "task" : "profile"} ${id}`);
      console.log(`File path: ${filePath}`);
      console.log(`File size: ${stats.size} bytes`);
      console.log(`Last modified: ${stats.mtime.toISOString()}`);
      console.log(`Content type: ${contentType}`);
      const fileContent = await fs3.readFile(filePath);
      res.send(fileContent);
      console.log(`Successfully served fresh file: ${filename}`);
    } catch (fileError) {
      console.error(`File not found: ${filePath}`, fileError);
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Error serving output file:", error);
    res.status(500).json({ error: "Failed to serve output file" });
  }
}

// server/middlewares/taskManager.ts
import * as fs4 from "fs";
import * as path6 from "path";
async function initializeTasks() {
  try {
    console.log("Initializing tasks from Task Center...");
    await loaddAllTasksFromCenter();
    setInterval(autoRunTask, (INTERVAL_OF_AUTO_RUN_TASK || 60) * 1e3);
  } catch (error) {
    console.error("Failed to initialize tasks from Task Center:", error);
  }
}
async function loaddAllTasksFromCenter() {
  if (process.env.TASK_CENTER_URL) {
    try {
      const apiKey = process.env.TASK_CENTER_API_KEY;
      if (!apiKey) {
        return;
      }
      const updateUrl = `${process.env.TASK_CENTER_URL}/api/users/${process.env.TASK_CENTER_USER_ID}/tasks`;
      const response = await fetch(updateUrl, {
        method: "GET",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.log(`Failed to fetch task from Task Center`);
        return null;
      }
      const taskCenterTasks = await response.json();
      let syncedCount = 0;
      let newCount = 0;
      if (taskCenterTasks && taskCenterTasks.length > 0) {
        for (const task of taskCenterTasks) {
          const existingTask = await storage.getTask(task.id);
          if (!existingTask) {
            await storage.createTask(task);
            newCount++;
          } else {
            await storage.updateTask(task.id, task);
            syncedCount++;
          }
        }
      }
      const tasks = await storage.getTasks();
      tasks.sort((a, b) => a.id - b.id);
      console.log("Tasks loaded from Task Center:", tasks.length);
      return tasks;
    } catch (error) {
      console.log(`Failed to fetch task from Task Center`);
      return null;
    }
  }
}
async function runTaskById(id) {
  try {
    const task = await storage.getTask(id);
    if (!task) {
      console.log(`Task ${id} not found`);
      return;
    }
    if (await isRunningTask(id)) {
      throw new Error(`Task ${id} is already running`);
    }
    if (task?.profileId && await isRunningProfileOfTask(task?.profileId)) {
      console.log(`Profile ${task?.profileId} of Task ${id} is already running`);
      return;
    }
    const profileData = task.profile;
    const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;
    let profilePath;
    let profileConfig;
    let scriptContent = "";
    try {
      if (dedicatedProfileId) {
        const profileId = dedicatedProfileId.toString();
        profilePath = path6.join(LOCAL_PROFILE, profileId);
        const configPath = path6.join(profilePath, "config.json");
        console.log(`[Task ${id}] Using dedicated profile ${profileId} from ${profilePath}`);
        try {
          const dedicatedConfigData = await fs4.promises.readFile(profilePath, "utf8");
          profileConfig = JSON.parse(dedicatedConfigData);
          console.log(`[Task ${id}] Read config.json from dedicated profile`);
        } catch (configError) {
          console.error(`[Task ${id}] Failed to read config from dedicated profile:`, configError);
          profileConfig = {
            id: id.toString(),
            name: `Task ${id} Profile`,
            description: `Profile for task ${id}`,
            created: (/* @__PURE__ */ new Date()).toISOString(),
            lastModified: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      } else {
        const profileId = task.profileId?.toString() || "Unknown";
        profilePath = path6.join(TASKS_PROFILE, profileId);
        await fs4.promises.mkdir(profilePath, { recursive: true });
        console.log(`[Task ${id}] Created temporary profile directory: ${profilePath} (folder: ${profileId})`);
        profileConfig = task.profile || {};
        try {
          profileConfig.customField = JSON.parse(profileConfig.customField);
        } catch (error) {
        }
        const configPath = path6.join(profilePath, "config.json");
        await fs4.promises.writeFile(configPath, JSON.stringify(profileConfig, null, 2), "utf8");
        console.log(`[Task ${id}] Created config.json from task profile data`);
      }
      const chromeProfilePath = path6.join(profilePath, "chrome-profile");
      await fs4.promises.mkdir(chromeProfilePath, { recursive: true });
      const taskPath = path6.join(profilePath, "task-" + id.toString());
      await fs4.promises.mkdir(taskPath, { recursive: true });
      const script = task.script || {};
      scriptContent = script.content || "";
      const scriptPath = path6.join(taskPath, "script.js");
      await fs4.promises.writeFile(scriptPath, scriptContent, "utf8");
      console.log(`[Task ${id}] Created script.js`);
      const request = task.request;
      const requestPath = path6.join(taskPath, "request.json");
      const requestData = typeof request === "string" ? request : JSON.stringify(request, null, 2);
      await fs4.promises.writeFile(requestPath, requestData, "utf8");
      console.log(`[Task ${id}] Created request.json`);
      const executionConfig = {
        type: "task",
        taskId: id,
        taskPath,
        task,
        profileId: task.profile.id,
        profilePath,
        profile: task.profile,
        config: config_exports
      };
      await updateTaskCenter(id.toString(), "RUNNING", null);
      await storage.updateTask(id, {
        status: "RUNNING"
      });
      const result = await executeScript(executionConfig);
      await storage.updateTask(id, {
        status: result.status,
        response: result
      });
      await updateTaskCenter(id.toString(), result.status, result);
    } catch (error) {
      console.error(`[Task ${id}] Error during execution:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`[Task ${id}] Error during task execution:`, error);
    throw error;
  }
}
async function updateTaskCenter(id, status, response) {
  if (process.env.TASK_CENTER_URL) {
    try {
      const apiKey = process.env.TASK_CENTER_API_KEY;
      const userId = process.env.TASK_CENTER_USER_ID;
      if (!apiKey) {
        return;
      }
      const updateUrl = `${process.env.TASK_CENTER_URL}/api/users/${userId}/tasks/${id}`;
      console.log("Updating task to center.....", updateUrl);
      const updateResult = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          response
        })
      });
      if (!updateResult.ok) {
        throw new Error(`Failed to update task in Task Center: ${updateResult.status}`);
      }
    } catch (error) {
      console.error(`[Task ${id}] Failed to update Task Center:`, error);
    }
  }
}
async function autoRunTask() {
  if (IS_AUTO_RUN_TASK != true) {
    return;
  }
  console.log("start auto run...");
  try {
    if (await getRunningTaskCount() >= PARRALEL_RUNNING_TASK) {
      console.log("Auto run is disabled because there are running scripts");
      return;
    }
    const tasks = await loaddAllTasksFromCenter();
    if (!tasks) {
      console.log("No tasks found");
      return;
    }
    const task = await getTaskToRun(tasks);
    if (!task) {
      console.log("No task could be executed");
      return;
    } else {
      try {
        await runTaskById(task.id);
      } catch (error) {
        console.error(`Failed to auto-run task ${task.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Auto-run error:", error);
  }
}
async function getTaskToRun(tasks) {
  let task = null;
  for (const centerTask of tasks) {
    if (centerTask.status === "READY") {
      if (centerTask?.profileId && await isRunningProfileOfTask(centerTask?.profileId)) {
        console.log(`Profile ${centerTask?.profileId} of Task ${centerTask.id} is already running`);
        continue;
      } else {
        task = centerTask;
        return task;
      }
    }
  }
  return task;
}

// server/routes/tasks.ts
function registerTaskRoutes(app2) {
  app2.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Failed to fetch tasks from storage:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks/:id/run", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { headless = false } = req.body;
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const profileData = task.profile;
      const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;
      if (!dedicatedProfileId && (!task.profile || !task.script)) {
        return res.status(400).json({
          message: "Task missing dedicated profile or profile/script data",
          details: {
            hasDedicatedProfile: !!dedicatedProfileId,
            hasProfile: !!task.profile,
            hasScript: !!task.script
          }
        });
      }
      const result = await runTaskById(taskId);
      res.json({
        message: `Task [${task.id}] Executed Completely`,
        status: "success",
        execution: result
      });
    } catch (error) {
      console.error("Task execution error:", error);
      return res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Task execution failed",
        execution: {
          status: "error"
        }
      });
    }
  });
  app2.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateTask(id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.post("/api/tasks/fetch-from-task-center", async (req, res) => {
    try {
      const taskCenterTasks = await loaddAllTasksFromCenter();
      res.json({
        message: "Successfully fetched and stored tasks from Task Center",
        stats: {
          total: taskCenterTasks?.length || 0
        }
      });
    } catch (error) {
      console.error("Fetch from Task Center error:", error);
      res.status(500).json({
        message: "Failed to fetch from Task Center",
        error: error?.message || "Unknown error"
      });
    }
  });
  app2.get("/api/tasks/:id/log", (req, res) => getLog(req, res, true));
  app2.get("/api/tasks/:id/output", (req, res) => getOutput(req, res, true));
  app2.get("/api/tasks/:id/output/:filename", (req, res) => getOutputFile(req, res, true));
  app2.post("/api/tasks/:id/clear", async (req, res) => {
    try {
    } catch (error) {
      console.error(`[Task Clear] Error clearing task ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to clear task data",
        error: error?.message || "Unknown error"
      });
    }
  });
  app2.post("/api/tasks/:id/stop", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.profileId) {
        const profileDir = path7.join(TASKS_PROFILE, task.profileId?.toString() || "", "chrome-profile");
        const killResult = await killChromeProcessesUsingProfile(profileDir);
        console.log(`[Task ${taskId}] Chrome processes terminated: ${killResult.message}`);
      }
      try {
        const taskPath = await getTaskPathFromTaskId(taskId);
        if (taskPath) {
          const logPath = path7.join(taskPath, "script.log");
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const stopMessage = `
=== Task Execution STOPPED ${timestamp} ===
Execution was manually stopped by user.
Chrome processes terminated.
=== End Stop Log ===
`;
          await fs5.promises.appendFile(logPath, stopMessage, "utf8");
          console.log(`[Task ${taskId}] Stop action logged to script.log`);
        }
      } catch (logError) {
        console.error(`[Task ${taskId}] Failed to log stop action:`, logError);
      }
      await storage.updateTask(taskId, { status: "FAILED" });
      await updateTaskCenter(taskId.toString(), "FAILED", null);
      res.json({ message: "Task execution stopped" });
    } catch (error) {
      console.error("Stop task error:", error);
      res.status(500).json({ message: "Failed to stop task" });
    }
  });
  app2.post("/api/tasks/:id/open-browser", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const profileData = task.profile;
      const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;
      if (dedicatedProfileId) {
        const profileDir = path7.join(TASKS_PROFILE, dedicatedProfileId.toString(), "chrome-profile");
        await openChromeWithProfile(profileDir, profileData);
        res.json({
          message: "Browser opened with dedicated profile",
          profileId: dedicatedProfileId
        });
      } else if (task.profile) {
        const taskProfileDir = path7.join(TASKS_PROFILE, task.profileId?.toString() || "", "chrome-profile");
        await openChromeWithProfile(taskProfileDir, task.profile);
        res.json({
          message: "Browser opened with task profile",
          taskId
        });
      } else {
        return res.status(400).json({ message: "Task has no profile configuration" });
      }
    } catch (error) {
      console.error("Open browser error:", error);
      res.status(500).json({
        message: "Failed to open browser",
        error: error?.message || "Unknown error"
      });
    }
  });
}

// server/routes/profiles.ts
import fs6 from "fs/promises";
import path9 from "path";

// server/middlewares/profileManager.ts
import fsPromises from "fs/promises";
import path8 from "path";
async function initializeProfiles() {
  try {
    console.log("Initializing profiles from local storage...");
    await loadAllProfilesFromLocal();
    setInterval(autoRunProfile, (INTERVAL_OF_AUTO_RUN_PROFILE || 60) * 1e3);
  } catch (error) {
    console.error("Failed to initialize profiles from local storage", error);
  }
}
async function loadAllProfilesFromLocal() {
  try {
    await ensureProfilesDirectory();
    const profiles = [];
    const items = await fsPromises.readdir(LOCAL_PROFILE);
    for (const item of items) {
      if (!item.match(/^\d+$/)) continue;
      const profilePath = path8.join(LOCAL_PROFILE, item);
      const configPath = path8.join(profilePath, "config.json");
      try {
        const configData = await fsPromises.readFile(configPath, "utf8");
        const profile = JSON.parse(configData);
        profiles.push(profile);
      } catch (error) {
        console.warn(`Failed to load profile from folder ${item}:`, error);
      }
    }
    for (const profile of profiles) {
      const existingProfile = await storage.getProfile(profile.id);
      if (!existingProfile) {
        await storage.createProfile(profile);
      } else {
        await storage.updateProfile(profile.id, profile);
      }
    }
    console.log("Profiles loaded from local storage:", profiles.length);
    return profiles.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error("Failed to load profiles from folder:", error);
    return [];
  }
}
async function createProfileFolder(profile) {
  await ensureProfilesDirectory();
  const profilePath = path8.join(LOCAL_PROFILE, profile.id.toString());
  try {
    await fsPromises.mkdir(profilePath, { recursive: true });
    await fsPromises.mkdir(path8.join(profilePath, "local"), { recursive: true });
    let configData = profile;
    configData.created = new Date(profile.created).toISOString(), configData.lastModified = (/* @__PURE__ */ new Date()).toISOString(), configData.status = "READY";
    await fsPromises.writeFile(
      path8.join(profilePath, "config.json"),
      JSON.stringify(configData, null, 2),
      "utf8"
    );
    const scriptPath = path8.join(ORIGINAL_CWD, "server", "scripts", "samples");
    let scriptContent = `// Browser Automation Script for ${profile.name}
`;
    if (IS_TWITTER_CARRING) {
      scriptContent += await fsPromises.readFile(path8.join(scriptPath, "twitterCarring.js"), "utf8");
    } else {
      scriptContent += await fsPromises.readFile(path8.join(scriptPath, "example.js"), "utf8");
    }
    console.log("Script Content: ");
    console.log(scriptContent);
    await fsPromises.writeFile(
      path8.join(profilePath, "local", "script.js"),
      scriptContent,
      "utf8"
    );
    return profilePath;
  } catch (error) {
    console.error(`Failed to create profile folder for ${profile.name}:`, error);
    throw new Error(`Failed to create profile folder: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function getProfileFolder(profileId) {
  try {
    await ensureProfilesDirectory();
    const simplePath = path8.join(LOCAL_PROFILE, profileId.toString());
    try {
      await fsPromises.access(simplePath);
      return simplePath;
    } catch {
    }
    const items = await fsPromises.readdir(LOCAL_PROFILE);
    for (const item of items) {
      const profilePath = path8.join(LOCAL_PROFILE, item);
      const configPath = path8.join(profilePath, "config.json");
      try {
        const stats = await fsPromises.stat(profilePath);
        if (stats.isDirectory() && await fsPromises.access(configPath).then(() => true).catch(() => false)) {
          const configContent = await fsPromises.readFile(configPath, "utf-8");
          const config = JSON.parse(configContent);
          if (parseInt(config.id) === profileId) {
            return profilePath;
          }
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Failed to find profile folder for ID ${profileId}:`, error);
    return null;
  }
}
async function deleteProfileFolder(profileId) {
  try {
    const profilePath = path8.join(LOCAL_PROFILE, profileId.toString());
    await fsPromises.rm(profilePath, { recursive: true, force: true });
    console.log(`Deleted profile folder: ${profilePath}`);
  } catch (error) {
    console.error(`Failed to delete profile folder for ID ${profileId}:`, error);
  }
}
async function updateProfileInfo(profile) {
  const profilePath = await getProfileFolder(profile.id);
  if (!profilePath) return;
  try {
    const configPath = path8.join(profilePath, "config.json");
    await fsPromises.writeFile(configPath, JSON.stringify(profile, null, 2), "utf8");
  } catch (error) {
    console.error(`Failed to update profile info for ID ${profile.id}:`, error);
  }
}
async function updateProfileStatusInConfig(profileId, status) {
  try {
    const configPath = path8.join(LOCAL_PROFILE, profileId.toString(), "config.json");
    const configData = await fsPromises.readFile(configPath, "utf8");
    const profileConfig = JSON.parse(configData);
    profileConfig.status = status;
    await fsPromises.writeFile(configPath, JSON.stringify(profileConfig, null, 2));
    console.log(`Updated profile ${profileId} status to ${status} in config.json`);
  } catch (error) {
    console.error(`Failed to update status in config.json for profile ${profileId}:`, error);
  }
}
async function runProfileById(id) {
  try {
    await storage.updateProfile(id, { status: "RUNNING" });
    await updateProfileStatusInConfig(id, "RUNNING");
    const profile = await storage.getProfile(id);
    if (!profile) {
      return {
        status: "FAILED",
        message: "Profile not found",
        duration: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        browserType: "",
        profileId: id,
        profileName: "",
        error: "Profile not found"
      };
    }
    console.log(
      `[Profile ${id}] Starting browser automation for: ${profile.name}`
    );
    const profilePath = await getProfileFolder(id);
    if (!profilePath) {
      return {
        status: "FAILED",
        message: "Profile folder not found",
        duration: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        browserType: "",
        profileId: id,
        profileName: profile?.name || "",
        error: "Profile folder not found"
      };
    }
    const taskPath = path8.join(profilePath, "local");
    ;
    const profileConfig = await readProfileConfig(profilePath, profile);
    const executionConfig = {
      type: "profile",
      taskId: 0,
      taskPath,
      task: null,
      profileId: profileConfig.id,
      profilePath,
      profile: profileConfig,
      config: config_exports
    };
    const result = await executeScript(executionConfig);
    await storage.updateProfile(id, { status: result.status });
    await updateProfileStatusInConfig(id, result.status);
    return result;
  } catch (error) {
    console.error("Launch profile error:", error);
    try {
      await storage.updateProfile(id, { status: "FAILED" });
      await updateProfileStatusInConfig(id, "FAILED");
    } catch (statusError) {
      console.error("Failed to update profile status:", statusError);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "FAILED",
      message: "Failed to launch profile",
      duration: 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      browserType: "",
      profileId: id,
      profileName: "",
      error: errorMessage
    };
  }
}
var availProfiles = new Array();
async function autoRunProfile() {
  if (IS_AUTO_RUN_PROFILE != true) {
    return;
  }
  console.log("start auto run...");
  try {
    if (await getRunningProfileCount() >= PARRALEL_RUNNING_PROFILE) {
      console.log("Auto run is disabled because there are running scripts");
      return;
    }
    let profileIds = await storage.getProfileIds();
    for (const profileId of profileIds) {
      availProfiles.includes(profileId) ? "" : availProfiles.push(profileId);
    }
    for (const profileId of availProfiles) {
      profileIds.includes(profileId) ? "" : availProfiles.splice(availProfiles.indexOf(profileId), 1);
    }
    if (!availProfiles) {
      console.log("No tasks found");
      return;
    } else {
      const profileId = availProfiles[0];
      availProfiles.shift();
      availProfiles.push(profileId);
      try {
        await runProfileById(profileId);
      } catch (error) {
        console.error(`Failed to auto-run task ${profileId}:`, error);
      }
    }
  } catch (error) {
    console.error("Auto-run error:", error);
  }
}
async function ensureProfilesDirectory() {
  try {
    await fsPromises.access(LOCAL_PROFILE);
  } catch {
    await fsPromises.mkdir(LOCAL_PROFILE, { recursive: true });
  }
}

// server/routes/profiles.ts
function registerProfileRoutes(app2) {
  app2.post("/api/profiles", async (req, res) => {
    try {
      const profileData = {
        ...req.body,
        name: req.body.name || `New Profile ${Date.now()}`,
        description: req.body.description || "New profile"
      };
      const profile = await storage.createProfile(profileData);
      console.log(`Created new profile: ${profile.name} (ID: ${profile.id})`);
      try {
        console.log(`Attempting to create profile folder for ID: ${profile.id}`);
        const folderPath = await createProfileFolder(profile);
        console.log(`Successfully created profile folder at: ${folderPath}`);
      } catch (folderError) {
        console.error(`Failed to create profile folder for ID ${profile.id}:`, folderError.message);
        console.error(`Full error:`, folderError);
      }
      res.json(profile);
    } catch (error) {
      console.error("Create profile error:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });
  app2.get("/api/profiles", async (req, res) => {
    try {
      console.log("Loading profiles...");
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Get profiles error:", error);
      res.status(500).json({ message: "Failed to get profiles" });
    }
  });
  app2.get("/api/profiles/:id", async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      try {
        const configPath = path9.join(LOCAL_PROFILE, profileId.toString(), "config.json");
        const configData = await fs6.readFile(configPath, "utf8");
        const config = JSON.parse(configData);
        const profileWithCustomField = {
          ...profile,
          customField: config.customField || profile.customField || {}
        };
        res.json(profileWithCustomField);
      } catch (configError) {
        console.warn(`Could not load config.json for profile ${profileId}:`, configError.message);
        res.json(profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  app2.put("/api/profiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.updateProfile(id, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      try {
        await updateProfileInfo(profile);
      } catch (folderError) {
        console.warn(`Failed to update profile folder: ${folderError.message}`);
      }
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.delete("/api/profiles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProfile(id);
      if (!success) {
        return res.status(404).json({ message: "Profile not found" });
      }
      try {
        await deleteProfileFolder(id);
      } catch (folderError) {
        console.warn(`Failed to delete profile folder: ${folderError.message}`);
      }
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Delete profile error:", error);
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });
  app2.get("/api/profiles/:id/script", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const profileFolder = await getProfileFolder(id);
      if (!profileFolder) {
        return res.status(404).json({ message: "Profile folder not found" });
      }
      const scriptPath = path9.join(profileFolder, "local", "script.js");
      let content = "";
      try {
        content = await fs6.readFile(scriptPath, "utf8");
      } catch (error) {
        content = `// Browser Automation Script for ${profile.name}
// You can use the following variables:
// - browser: Puppeteer browser instance
// - page: Use browser.newPage() to create a new page


`;
        await fs6.writeFile(scriptPath, content, "utf8");
      }
      res.json({ content });
    } catch (error) {
      console.error("Get script error:", error);
      res.status(500).json({ message: "Failed to get script" });
    }
  });
  app2.put("/api/profiles/:id/script", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      const profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const profilePath = await getProfileFolder(id);
      if (!profilePath) {
        return res.status(404).json({ message: "Profile folder not found" });
      }
      const scriptPath = path9.join(profilePath, "local", "script.js");
      await fs6.writeFile(scriptPath, content, "utf8");
      res.json({ message: "Script updated successfully" });
    } catch (error) {
      console.error("Update script error:", error);
      res.status(500).json({ message: "Failed to update script" });
    }
  });
  app2.post("/api/profiles/:id/launch", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const result = await runProfileById(id);
      if (result.status === "COMPLETED") {
        res.json({
          status: "success",
          message: `Profile [${id}] Executed Completely`,
          execution: result
        });
      } else {
        res.status(500).json({
          message: `Profile [${id}] execution failed`,
          error: result.error,
          execution: result
        });
      }
    } catch (error) {
      console.error("Error launching profile:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        message: "Failed to launch profile",
        error: errorMessage,
        execution: error
      });
    }
  });
  app2.get(
    "/api/profiles/:id/log",
    (req, res) => getLog(req, res, false)
  );
  app2.get(
    "/api/profiles/:id/output",
    (req, res) => getOutput(req, res, false)
  );
  app2.get(
    "/api/profiles/:id/output/:filename",
    (req, res) => getOutputFile(req, res, false)
  );
  app2.post("/api/profiles/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const chromeProfile = path9.join(LOCAL_PROFILE, id.toString(), "chrome-profile");
      const killResult = await killChromeProcessesUsingProfile(chromeProfile);
      console.log(`[Profile ${id}] Chrome processes terminated: ${killResult.message}`);
      try {
        const logPath = path9.join(LOCAL_PROFILE, id.toString(), "script.log");
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const stopMessage = `
=== Script Execution STOPPED ${timestamp} ===
Execution was manually stopped by user.
Chrome processes terminated.
=== End Stop Log ===
`;
        await fs6.appendFile(logPath, stopMessage, "utf8");
        console.log(`[Profile ${id}] Stop action logged to script.log`);
      } catch (logError) {
        console.error(`[Profile ${id}] Failed to log stop action:`, logError);
      }
      await storage.updateProfile(id, { status: "FAILED" });
      await updateProfileStatusInConfig(id, "FAILED");
      res.json({ message: "Profile execution stopped" });
    } catch (error) {
      console.error("Stop profile error:", error);
      res.status(500).json({ message: "Failed to stop profile" });
    }
  });
  app2.post("/api/profiles/:id/open-browser", async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const chromeProfileDir = path9.join(LOCAL_PROFILE, profileId.toString(), "chrome-profile");
      await openChromeWithProfile(chromeProfileDir, profile);
      res.json({
        message: "Browser opened with profile configuration",
        profileId
      });
    } catch (error) {
      console.error("Open browser error:", error);
      res.status(500).json({
        message: "Failed to open browser",
        error: error?.message || "Unknown error"
      });
    }
  });
}

// server/routes/proxy.ts
import { HttpsProxyAgent } from "https-proxy-agent";
import axios from "axios";
function registerProxyRoutes(app2) {
  app2.post("/api/proxy-test", async (req, res) => {
    try {
      const {
        proxyType,
        proxyHost,
        proxyPort,
        proxyUsername,
        proxyPassword,
        testUrl = "https://ifconfig.me/ip"
      } = req.body;
      if (!proxyHost || !proxyPort) {
        return res.status(400).json({
          error: "Proxy host and port are required"
        });
      }
      const proxyUrl = `${proxyType}://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;
      const agent = new HttpsProxyAgent(proxyUrl);
      const response = await axios.get(testUrl, {
        httpsAgent: agent,
        httpAgent: agent,
        timeout: 1e4
      });
      res.json({
        success: true,
        ip: response.data.trim()
      });
    } catch (error) {
      console.error("Proxy test failed:", error);
      let message = "Proxy test failed";
      let status = 500;
      if (error.code === "ECONNABORTED") {
        message = "Proxy connection timed out";
        status = 408;
      } else if (error.code === "ERR_PROXY_AUTHENTICATION_REQUIRED") {
        message = "Invalid proxy credentials";
        status = 401;
      } else if (error.code === "ECONNREFUSED") {
        message = "Proxy connection refused";
        status = 503;
      }
      res.status(status).json({
        success: false,
        message
      });
    }
  });
}

// server/routes/settings.ts
function registerSettingsRoutes(app2) {
  app2.get("/api/settings", async (req, res) => {
    try {
      let executionStatus = {
        runningTasks: 0,
        runningProfiles: 0
      };
      try {
        const runningTasks = await getRunningTaskCount();
        const runningProfiles = await getRunningProfileCount();
        executionStatus = {
          runningTasks,
          runningProfiles
        };
      } catch (error) {
        console.error("Error getting execution status:", error);
      }
      res.json({
        executionStatus,
        taskSettings: {
          isAutoRunTask: IS_AUTO_RUN_TASK,
          intervalOfAutoRunTask: INTERVAL_OF_AUTO_RUN_TASK,
          parallelRunningTask: PARRALEL_RUNNING_TASK
        },
        profileSettings: {
          isAutoRunProfile: IS_AUTO_RUN_PROFILE,
          intervalOfAutoRunProfile: INTERVAL_OF_AUTO_RUN_PROFILE,
          parallelRunningProfile: PARRALEL_RUNNING_PROFILE,
          isTwitterCarring: IS_TWITTER_CARRING
        }
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({
        error: "Failed to fetch settings"
      });
    }
  });
  app2.post("/api/settings/tasks", async (req, res) => {
    try {
      const { isAutoRunTask, intervalOfAutoRunTask, parallelRunningTask } = req.body;
      updateTaskSettings({
        isAutoRunTask,
        intervalOfAutoRunTask,
        parallelRunningTask
      });
      res.json({
        success: true,
        settings: {
          isAutoRunTask: IS_AUTO_RUN_TASK,
          intervalOfAutoRunTask: INTERVAL_OF_AUTO_RUN_TASK,
          parallelRunningTask: PARRALEL_RUNNING_TASK
        }
      });
    } catch (error) {
      console.error("Error updating task settings:", error);
      res.status(500).json({
        error: "Failed to update task settings"
      });
    }
  });
  app2.post("/api/settings/profiles", async (req, res) => {
    try {
      const { isAutoRunProfile, intervalOfAutoRunProfile, parallelRunningProfile, isTwitterCarring } = req.body;
      updateProfileSettings({
        isAutoRunProfile,
        intervalOfAutoRunProfile,
        parallelRunningProfile,
        isTwitterCarring
      });
      res.json({
        success: true,
        settings: {
          isAutoRunProfile: IS_AUTO_RUN_PROFILE,
          intervalOfAutoRunProfile: INTERVAL_OF_AUTO_RUN_PROFILE,
          parallelRunningProfile: PARRALEL_RUNNING_PROFILE,
          isTwitterCarring: IS_TWITTER_CARRING
        }
      });
    } catch (error) {
      console.error("Error updating profile settings:", error);
      res.status(500).json({
        error: "Failed to update profile settings"
      });
    }
  });
  app2.post("/api/settings/terminate-chrome", async (req, res) => {
    try {
      const result = await killAllChromeProcesses();
      res.json(result);
    } catch (error) {
      console.error("Error terminating Chrome processes:", error);
      res.status(500).json({
        error: "Failed to terminate Chrome processes",
        details: error.message
      });
    }
  });
}

// server/routes/index.ts
async function registerRoutes(app2) {
  registerAuthRoutes(app2);
  registerTaskRoutes(app2);
  registerProfileRoutes(app2);
  registerProxyRoutes(app2);
  registerSettingsRoutes(app2);
  const server = createServer(app2);
  return server;
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path10 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path10.startsWith("/api")) {
      let logLine = `${req.method} ${path10} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    setupVite(app, server).catch((err) => {
      console.error("Error setting up Vite:", err);
    });
  } else {
    serveStatic(app);
  }
  await initialize();
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0"
    // reusePort: trueregisterRoutes,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
async function initialize() {
  initializeWebSocketServer();
  innitializeConfig();
  await initializeTasks();
  await initializeProfiles();
}
