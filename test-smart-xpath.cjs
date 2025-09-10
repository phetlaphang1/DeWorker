const puppeteer = require("puppeteer");
const act = require("./server/scripts/libs/helpers.cjs");

(async () => {
  console.log("🚀 Testing Smart XPath Adapter System");
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test với Google
    console.log("\n=== TEST 1: Google Search ===");
    await page.goto("https://google.com");
    
    // Test nhiều cách nhập selector khác nhau
    console.log("\n1. Testing simple selector 'q' (should find Google search input):");
    await act.type(page, "q", "smart xpath test");
    
    console.log("\n2. Testing simple text 'search' (should find search input by placeholder):");
    await page.reload();
    await act.type(page, "search", "search by placeholder");
    
    console.log("\n3. Testing CSS selector 'input[name=\"q\"]':");
    await page.reload();
    await act.type(page, "input[name='q']", "css input selector");
    
    console.log("\n4. Testing XPath selector '//textarea[@name=\"q\"]' (Google's actual input):");
    await page.reload();
    await act.type(page, "//textarea[@name='q']", "xpath textarea");
    
    console.log("\n5. Testing click Google Search button:");
    await act.type(page, "q", "test search");
    // Thử click button search 
    await act.click(page, "Google Search");
    
    await page.waitForTimeout(3000);
    
    console.log("\n✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
})();