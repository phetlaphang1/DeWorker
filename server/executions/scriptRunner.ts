import puppeteer, { Page as PuppeteerPage } from "puppeteer";
import playwright, { Page as PlaywrightPage } from "playwright";
import * as proxyChain from "proxy-chain";
import * as path from "path";
import { promises as fs } from "fs";
import { Profile } from "@shared/schema";
import { ExecutionConfig, ExecutionResult } from "./executionTypes";
import { runUserScript } from "./userScriptRunner";

export async function launchPuppeteer(executionConfig: ExecutionConfig){
  const profile: Profile = executionConfig.profile;
  const config = executionConfig.config;
   // Configure browser launch options for local display
   const launchOptions: any = {   
    headless: process.platform === 'win32'? profile.isHeadless : true,
    executablePath: process.platform === 'win32'? config.PATH_OF_CHROME_WIN32 : puppeteer.executablePath(),
    userDataDir: path.join(executionConfig.profilePath, "chrome-profile"),
    ignoreDefaultArgs: ["--disable-extensions"],    
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox", 
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--ignore-certificate-errors",
      "--ignore-ssl-errors",
      "--ignore-certificate-errors-spki-list",
      "--ignore-certificate-errors-skip-list",
      "--disable-web-security",
      "--allow-running-insecure-content",
      `--window-size=${profile.viewportWidth || 1280},${profile.viewportHeight || 720}`,
    ],
  };
  
  // Configure proxy if enabled
  if (profile.useProxy && profile.proxyHost && profile.proxyPort && profile.proxyUsername && profile.proxyPassword) {
    // // Support both full proxy URLs and separate host/port configurations
    // let proxyString: string;
    
    // if (profile.proxyHost.includes('://')) {
    //   // Full proxy URL format (e.g., "socks4://host:port")
    //   proxyString = profile.proxyHost;
    //   // Remove duplicate protocol if it exists in the URL already
    //   if (proxyString.startsWith(`${profile.proxyType}://`) && profile.proxyType) {
    //     // URL already has correct protocol, use as-is
    //   } else {
    //     // Add protocol if missing
    //     proxyString = `${profile.proxyType}://${profile.proxyHost}`;
    //   }
    // } else {
    //   // Separate host and port
    //   proxyString = `${profile.proxyType}://${profile.proxyHost}:${profile.proxyPort}`;
    // }

    const proxyUrl = `${profile.proxyType}://${profile.proxyUsername}:${profile.proxyPassword}@${profile.proxyHost}:${profile.proxyPort}`;    
    const anonymizedProxy = await proxyChain.anonymizeProxy(proxyUrl);
    console.log("Using proxy:", anonymizedProxy);
    launchOptions.args.push(`--proxy-server=${anonymizedProxy}`);
  }
  const browser = await puppeteer.launch(launchOptions);
  return browser;
}

export async function launchPlaywright(executionConfig: ExecutionConfig){
  const profile = executionConfig.profile;
  const config = executionConfig.config;
  // Playwright's launch options are structured a bit differently from Puppeteer's
  let launchOptions = {
    // 1. Headless mode is a direct option, similar to Puppeteer
    headless: profile.isHeadless,
    userDataDir: path.join(executionConfig.profilePath, "chrome-profile"),
    // 2. Executable path is a direct option
    // Playwright automatically detects the correct browser path for the platform
    // but you can still override it if needed.
    executablePath: process.platform === 'win32' ? config.PATH_OF_CHROME_WIN32 : playwright.chromium.executablePath(),

    // 3. Instead of a launch option, userDataDir is used with launchPersistentContext
    // We'll show the launch code below this block
    // userDataDir: path.join(profilePath, "chrome-profile"),

    // 4. Arguments are passed as an array
    args: [
      // These are standard arguments often needed for non-headless/CI environments
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-web-security',
      '--allow-running-insecure-content',
      // Note: --window-size is not a direct launch arg in Playwright.
      // Instead, the viewport is set on the page or context itself.
    ],

    // 5. Playwright has a dedicated option to ignore certificate errors
    ignoreHTTPSErrors: true,

  };
  let proxyString: string | undefined;

  // Configure proxy if enabled
  if (profile.useProxy && profile.proxyHost && profile.proxyPort) {
  proxyString = `${profile.proxyType}://${profile.proxyHost}:${profile.proxyPort}`;
  }

  const browser = await playwright.chromium.launchPersistentContext(
    launchOptions.userDataDir, {
      headless: launchOptions.headless!,
      executablePath: launchOptions.executablePath,
      ignoreHTTPSErrors: launchOptions.ignoreHTTPSErrors,
      args: launchOptions.args,      
      proxy: proxyString ? { server: proxyString } : undefined,
      // You can also set the viewport here
      viewport: {
        width: profile.viewportWidth!,
        height: profile.viewportHeight!,
      },
  });
  return browser
}

export async function runScript(
  executionConfig: ExecutionConfig
  // profilePath: string,
  // taskPath: string,
  // type: string,
  // id: number,
): Promise<ExecutionResult> { 
  let result: ExecutionResult;
  const profile = executionConfig.profile;   
  const config = executionConfig.config;
  const type = executionConfig.type;
  const id = type=='task'? executionConfig.taskId : executionConfig.profileId;
  const logPrefix = `[${type}-${id}]`;
  console.log(`${logPrefix} Using profile directory: ${executionConfig.profilePath}`);
  let scriptPath;  
  if(type == 'profile' && config.IS_TWITTER_CARRING){
    scriptPath = path.join(config.ORIGINAL_CWD, "server", "scripts", "samples", "twitterCarring.js");    
  }else{
    scriptPath = path.join(executionConfig.taskPath, "script.js");    
  }
  
  const scriptContent = await fs.readFile(scriptPath, "utf8");
  let browser;
  let pages;
  let page;
  if(config.BROWSER_TYPE == 'puppeteer'){
    browser = await launchPuppeteer(executionConfig);
    pages = await browser.pages() as PuppeteerPage[];
    page = pages[0]  as PuppeteerPage;    
    await page.setViewport({ width: profile.viewportWidth!, height: profile.viewportHeight! });    
    if (profile.proxyUsername && profile.proxyPassword) {
      console.log(`[Script] Setting up proxy authentication for ${profile.proxyUsername}`);
      await page.authenticate({
        username: profile.proxyUsername,
        password: profile.proxyPassword
      });
      console.log('[Script] Proxy authentication configured successfully');
    }       
  }else{
    browser = await launchPlaywright(executionConfig);
    pages = await browser.pages() as PlaywrightPage[];
    page = pages[0]  as PlaywrightPage; 
    await page.setViewportSize({ width: profile.viewportWidth!, height: profile.viewportHeight! });
    
    // Playwright uses different proxy authentication method
    // Proxy auth is typically configured during browser launch for Playwright    
    // TBA....
  }

  // Set up logging function
  const writeLogToFile = async (message: string): Promise<void> => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const logEntry = `[${timestamp}] ${message}\n`;
    const logPath = path.join(executionConfig.taskPath, "script.log");
    
    try {
      await fs.appendFile(logPath, logEntry, "utf8");
    } catch (error) {
      console.log(`Failed to write to script.log: ${error}`);
    }
  };

  // Create a profile-specific console function for script execution
  const originalConsoleLog = console.log;
  console.log = function (...args) {
    // Track seen objects for circular reference detection
    const seenObjects = new WeakSet();
    
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, (key, value) => {
              // Handle circular references
              if (typeof value === "object" && value !== null) {
                if (seenObjects.has(value)) {
                  return "[Circular]";
                }
                seenObjects.add(value);
              }
              return value;
            }, 2);
          } catch (error) {
            return `[Object: ${error}]`;
          }
        }
        return String(arg);
      })
      .join(" ");

    // Filter out Express HTTP request logs and other noise
    const shouldFilter =
      message.includes("[express]") ||
      message.includes("express] GET") ||
      message.includes("express] POST") ||
      message.includes("express] PUT") ||
      message.includes("express] DELETE") ||
      message.includes("304 in") ||
      message.includes("200 in") ||
      message.includes("500 in") ||
      message.includes("404 in") ||
      message.includes("in 1ms") ||
      message.includes("in 2ms") ||
      message.includes("in 3ms") ||
      message.includes("in 4ms") ||
      message.includes("in 5ms") ||
      message.includes("in 6ms") ||
      message.includes("in 7ms") ||
      message.includes("in 8ms") ||
      message.includes("in 9ms") ||
      message.includes("ms ::") ||
      message.includes(':: {"content":') ||
      message.includes("/api/browser-profiles/") ||
      message.includes("/api/tasks/") ||
      /\d+:\d+ [AP]M/.test(message);

    // Only capture relevant script execution logs
    if (!shouldFilter) {
      // Write to log file immediately
      writeLogToFile(`${logPrefix} ${message}`).catch(err => 
        originalConsoleLog(`Failed to write log: ${err}`)
      );
      
      // Send log message to parent process via IPC instead of calling broadcastLog directly
      if (process.send) {
        process.send({ 
          type: 'log',
          logData: { type, id, message, logType: 'info' }
        });
      }
      
      // Use original console.log to avoid recursion
      originalConsoleLog(`${logPrefix} ${message}`);
    }
  };

  // Create output directory
  const outputPath = path.join(executionConfig.taskPath, "output");
  await fs.mkdir(outputPath, { recursive: true });

  // Set up profile-specific paths
  console.log(`Using task directory: ${executionConfig.taskPath}`);
  

  try {
    // Execute the user script using the dedicated script execution module
    result = await runUserScript(
      executionConfig,
      scriptContent,
      executionConfig.taskPath,
      logPrefix,
      browser,
      page,
      writeLogToFile
    );
    // console.log(result);
    
    // Close the browser after script execution
    try {
      await browser.close();
      console.log(`Browser closed successfully`);
    } catch (closeError) {
      console.log(`Error closing browser: ${closeError}`);
    }

   
    
  } catch (error) {
    console.log(`${profile.name} Script execution error as: ${error}`);
    
    // Close the browser in case of error
    try {
      await browser.close();
      console.log(`${logPrefix} Browser closed after error`);
    } catch (closeError) {
      console.log(`${logPrefix} Error closing browser after script error: ${closeError}`);
    }
    
    
    result =  {
      status: "FAILED" as const,
      message: `Script execution failed: ${(error as Error).message}`,
      duration: 0,
      timestamp: new Date().toISOString(),
      browserType: "puppeteer" as const,
      profileId: profile.id,
      profileName: profile.name,
      error: (error as Error).message,
    };
  } finally{
    if (profile.isIncognito) {
      // Remove profile directory
      try {
        await fs.rm(executionConfig.profilePath, { recursive: true, force: true });  
        console.log(`Profile directory removed successfully`);
      } catch (removeError) {
        console.log(`Error removing profile directory: ${removeError}`);
      }
    }    
  }
  return result;
}

process.on("message", async (params: {
  config: ExecutionConfig;
  profilePath: string;
  taskPath: string;
  type: string;
  id: number;
}) => {
  try {
    // console.log(`PID: ${process.pid} of script received params:`, params);
    const result = await runScript(params.config);
    if (process.send) {
      process.send({ success: true, result });
    }

  } catch (error) {
    if (process.send) {
      process.send({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  } finally {
    process.exit(0);
  }
});
