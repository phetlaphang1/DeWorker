import { click, type as typeText } from "./server/scripts/libs/helpers.js";
import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto("https://www.google.com");
    console.log("Page title:", await page.title());
    
    // Find and type into search input - Google changes their selectors frequently
    try {
      // Try different selectors for Google search input
      await page.waitForSelector('textarea[name="q"]', { timeout: 5000 });
      await page.type('textarea[name="q"]', "youtube.com");
    } catch {
      try {
        await page.waitForSelector('input[name="q"]', { timeout: 5000 });
        await page.type('input[name="q"]', "youtube.com");
      } catch {
        await page.waitForSelector('[role="combobox"]', { timeout: 5000 });
        await page.type('[role="combobox"]', "youtube.com");
      }
    }
    
    // Press Enter to search (most reliable method)
    await page.keyboard.press('Enter');
    
    // Wait for results page to load
    try {
      await page.waitForSelector('[data-async-context]', { timeout: 10000 });
      console.log("Search completed successfully!");
    } catch {
      // Alternative: wait for URL change
      await page.waitForFunction(() => window.location.href.includes('/search'), { timeout: 10000 });
      console.log("Search page loaded!");
    }
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
  
  // Keep browser open for 5 seconds to see results
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await browser.close();
})();