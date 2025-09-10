import { promises as fs } from "fs";
import * as path from "path";
import { loadES6Module } from "./scriptModule";
import { ExecutionConfig, ExecutionResult } from "./executionTypes";
import { createRequire } from "module";

// Create require function for ES module context
const nodeRequire = createRequire(import.meta.url);

export async function runUserScript(
  config: ExecutionConfig,
  scriptContent: string,
  taskPath: string,
  logPrefix: string,
  browser: any,
  page: any,
  writeLogToFile: (message: string) => Promise<void>
): Promise<ExecutionResult> {
  // Execute the user script in async context
  try {
    // Preprocess script to handle ES6 imports by converting them to require statements
    let processedScript = scriptContent;
    console.log(`Original script (first 200 chars):`);
    console.log(scriptContent.substring(0, 200));

    // Convert ES6 import statements to require statements with mock modules
    const originalLength = processedScript.length;
    processedScript = processedScript.replace(
      /import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?/g,
      'const $1 = require("$2");',
    );
    processedScript = processedScript.replace(
      /import\s+(\w+)\s+from\s+["']([^"']+)["'];?/g,
      'const $1 = require("$2");',
    );

    // Add JSON parsing for config to ensure it's properly parsed
    processedScript = `try { config = JSON.parse(config); } catch (e) { }\n` + processedScript;

    // Log if any changes were made
    if (processedScript.length !== originalLength) {
      console.log(`Script imports converted to require statements`);
    } else {
      console.log(`No script changes made`);
    }

    const requireES6Module = await loadES6Module(writeLogToFile);

    // Ensure automation helpers are available in profile directory
    const helpersSourcePath = path.resolve("server/scripts/libs/helpers.cjs");
    const helpersTargetDir = path.join(taskPath, "libs");
    const helpersTargetPath = path.join(helpersTargetDir, "helpers.cjs");
    
    try {
      // Create libs directory if it doesn't exist
      await fs.mkdir(helpersTargetDir, { recursive: true });
      
      // Copy helpers file if it doesn't exist or is outdated
      try {
        await fs.access(helpersTargetPath);
        const sourceStat = await fs.stat(helpersSourcePath);
        const targetStat = await fs.stat(helpersTargetPath);
        if (sourceStat.mtime > targetStat.mtime) {
          await fs.copyFile(helpersSourcePath, helpersTargetPath);
          console.log("Updated automation helpers in profile directory");
        }
      } catch {
        await fs.copyFile(helpersSourcePath, helpersTargetPath);
        console.log("Copied automation helpers to profile directory");
      }
    } catch (error) {
      console.log(`Warning: Failed to setup automation helpers: ${(error as Error).message}`);
    }

    // Create custom require function that loads pre-loaded modules
    const requireForScript = (moduleName: string) => {
      console.log(`Script requesting module: ${moduleName}`);

      if (moduleName === "#gen") {
        console.log("Returning pre-loaded #gen module, keys: " + JSON.stringify(Object.keys(requireES6Module.genModule)));
        return requireES6Module.genModule;
      } else if (moduleName === "#act") {
        console.log("Returning pre-loaded #act module, keys: " + JSON.stringify(Object.keys(requireES6Module.actModule)));
        return requireES6Module.actModule;
      } else if (moduleName === "#actTwitter") {
        console.log("Returning pre-loaded #actTwitter module, keys: " + JSON.stringify(Object.keys(requireES6Module.actTwitterModule)));
        return requireES6Module.actTwitterModule;
      } else if (moduleName === "#rai") {
        console.log("Returning pre-loaded #rai module, keys: " + JSON.stringify(Object.keys(requireES6Module.raiModule)));
        return requireES6Module.raiModule;
      } else if (moduleName === "./libs/helpers.cjs") {
        // Load automation helpers from profile directory
        try {
          const helpersPath = path.join(taskPath, "libs", "helpers.cjs");
          delete nodeRequire.cache[helpersPath]; // Clear cache to ensure fresh load
          const helpers = nodeRequire(helpersPath);
          console.log("Loaded automation helpers, keys: " + JSON.stringify(Object.keys(helpers)));
          return helpers;
        } catch (error) {
          console.log(`Failed to load automation helpers: ${(error as Error).message}`);
          return {};
        }
      } else {
        // For other modules, use the Node.js require function
        try {
          return nodeRequire(moduleName);
        } catch (error) {
          console.log(`Failed to require module ${moduleName}: ${(error as Error).message}`);
          return {};
        }
      }
    };

    // Use eval to execute the script with proper async context and Node.js modules
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    console.log("Processed Script:....");
    console.log(processedScript);
    const scriptFunction = new AsyncFunction(
      "browser",
      "page",
      "fs",
      "path",
      "require",
      "console",
      "log",
      "config",
      processedScript,
    );

    // Import the required modules using nodeRequire
    const nodeFs = nodeRequire('fs');
    const nodePath = nodeRequire('path');
    
    // Create fs module with both sync and async methods for script access
    const fsForScript = {
      mkdir: fs.mkdir,
      writeFile: fs.writeFile,
      readFile: fs.readFile,
      access: fs.access,
      readFileSync: nodeFs.readFileSync,
      writeFileSync: nodeFs.writeFileSync,
      existsSync: nodeFs.existsSync,
      mkdirSync: nodeFs.mkdirSync,
      promises: {
        mkdir: fs.mkdir,
        writeFile: fs.writeFile,
        readFile: fs.readFile,
        access: fs.access,
      },
    };

    // Create path module with profile-specific utilities
    const pathForScript = {
      ...path,
      join: (...segments: any[]) => path.join(taskPath, ...segments),
      outputJoin: (...segments: any[]) =>
        path.join(taskPath + "/output/", ...segments),
      resolve: (...segments: any[]) => path.resolve(taskPath, ...segments),
    };

    await writeLogToFile('Executing automation script');
    const startTime = Date.now();
    
    // Store original working directory
    // const originalCwd = process.cwd();
    let resultDetail;
    try {
      // Change working directory to profile path for relative path resolution
      process.chdir(taskPath);
      
      resultDetail = await scriptFunction(
        browser,
        page, 
        fsForScript,
        pathForScript,
        requireForScript,
        console,
        { log: (message: string) => writeLogToFile(`[Script Log] ${message}`) },
        config
      );      
    } finally {
      // Restore original working directory
      // process.chdir(originalCwd);
    }
    
    const duration = Date.now() - startTime;
    await writeLogToFile('Script execution completed successfully');
    
    // Return success result
    return {
      status: "COMPLETED" as const,
      message: "Script execution completed successfully",
      duration,
      timestamp: getTimeStamp(),
      browserType: "puppeteer",
      profileId: config.profileId,
      profileName: config.profile.name,
      details: resultDetail
    };
  } catch (scriptError) {
    const errorMessage =
      scriptError instanceof Error
        ? scriptError.message
        : String(scriptError);
    const errorStack = scriptError instanceof Error ? scriptError.stack : "";
    await writeLogToFile(`Script execution error: ${errorMessage}`);
    if (errorStack) {
      await  writeLogToFile(`Error stack: ${errorStack}`);
      console.log(errorStack);
    }

    // Capture error screenshot to output folder
    try {
      if (browser && browser.pages && page) {       
        if (page && !page.isClosed()) {
         
          const errorScreenshotPath = path.join(
            taskPath,
            "output",
            `error_${getTimeStamp()}.png`,
          );
          // Ensure output directory exists
          await fs.mkdir(path.dirname(errorScreenshotPath), {
            recursive: true,
          });

          await page.screenshot({
            path: errorScreenshotPath,
            fullPage: false,
          });
          console.log(
            `${logPrefix} Error screenshot saved to ${errorScreenshotPath}`,
          );
        }
      }
    } catch (screenshotError: any) {
      console.log(
        `${logPrefix} Failed to capture error screenshot: ${screenshotError.message}`,
      );
    }

    // Return error result instead of throwing
    return {
      status: "FAILED" as const,
      message: errorMessage,
      duration: Date.now() - (Date.now()), // Will be 0 for errors
      timestamp: getTimeStamp(),
      browserType: "puppeteer",
      profileId: config.profileId,
      profileName: config.profile.name,
      details: errorStack,
      error: errorMessage,
    };
  } 
}

function getTimeStamp(){
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  return timeStamp;
}