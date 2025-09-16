/**
 * Helper functions for Puppeteer automation (CommonJS version)
 * Smart XPath Adapter System - Automatically handles different selector formats
 */

/**
 * Smart selector detection and normalization
 * @param {string} selector - Any type of selector (XPath, CSS, etc.)
 * @returns {Object} { type, normalized, alternatives }
 */
function analyzeSelector(selector) {
  const trimmed = selector.trim();
  
  // Detect selector type
  const analysis = {
    type: 'unknown',
    normalized: trimmed,
    alternatives: [],
    strategy: 'xpath'
  };

  // XPath patterns
  if (trimmed.startsWith('//') || trimmed.startsWith('/')) {
    analysis.type = 'xpath';
    analysis.normalized = trimmed;
  }
  // CSS selector patterns
  else if (trimmed.match(/^[.#]/) || trimmed.includes('>') || trimmed.includes('+') || trimmed.includes('~')) {
    analysis.type = 'css';
    analysis.strategy = 'css';
    analysis.normalized = trimmed;
  }
  // Attribute selector
  else if (trimmed.match(/^\[.+\]$/)) {
    analysis.type = 'attribute';
    analysis.normalized = `//*${trimmed}`;
    analysis.alternatives.push(trimmed); // Also try as CSS
  }
  // Text content selector
  else if (trimmed.includes('text()') || trimmed.includes('contains(')) {
    analysis.type = 'xpath-text';
    analysis.normalized = trimmed.startsWith('//') ? trimmed : `//${trimmed}`;
  }
  // Simple tag/attribute (most common case)
  else {
    analysis.type = 'simple';
    // Create multiple alternatives in priority order
    analysis.normalized = `//*[@name="${trimmed}"]`; // Most common for inputs
    analysis.alternatives = [
      trimmed, // As CSS selector
      `//*[@id="${trimmed}"]`, // As ID
      `//*[@placeholder="${trimmed}"]`, // As placeholder
      `//*[@class="${trimmed}"]`, // As exact class
      `//*[contains(@class, "${trimmed}")]`, // As partial class
      `input[name="${trimmed}"]`, // CSS input by name
      `input[placeholder*="${trimmed}"]`, // CSS input by placeholder
      `button[text()="${trimmed}"]`, // Button by text
      `//*[text()="${trimmed}"]`, // As text content
      `//*[contains(text(), "${trimmed}")]`, // As partial text
      `//input[@name="${trimmed}"]`, // Explicit input xpath
      `//button[contains(text(), "${trimmed}")]` // Button by partial text
    ];
  }

  return analysis;
}

/**
 * Try multiple selector strategies until one works
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} selector - Original selector
 * @param {string} action - Action type ('find', 'click', 'type', etc.)
 * @returns {Promise<Array>} Array of matching elements
 */
async function smartFind(page, selector, action = 'find') {
  const analysis = analyzeSelector(selector);
  const strategies = [];

  // Primary strategy
  if (analysis.strategy === 'css') {
    strategies.push({ type: 'css', selector: analysis.normalized });
  } else {
    strategies.push({ type: 'xpath', selector: analysis.normalized });
  }

  // Add alternative strategies
  for (const alt of analysis.alternatives) {
    if (alt.startsWith('.') || alt.startsWith('#') || alt.includes('>')) {
      strategies.push({ type: 'css', selector: alt });
    } else {
      strategies.push({ type: 'xpath', selector: alt });
    }
  }

  // Try each strategy
  for (const strategy of strategies) {
    try {
      let elements = [];
      
      if (strategy.type === 'css') {
        await page.waitForSelector(strategy.selector, { timeout: 2000 });
        elements = await page.$$(strategy.selector);
      } else {
        const xpathSelector = strategy.selector.startsWith('/') ? strategy.selector : `//${strategy.selector}`;
        await page.waitForSelector(`xpath/${xpathSelector}`, { timeout: 2000 });
        elements = await page.$$(`xpath/${xpathSelector}`);
      }

      if (elements.length > 0) {
        console.log(`✅ Smart selector found ${elements.length} element(s) using ${strategy.type}: "${strategy.selector}"`);
        return elements;
      }
    } catch (error) {
      console.log(`❌ Strategy failed - ${strategy.type}: "${strategy.selector}"`);
      continue;
    }
  }

  // If all strategies fail, throw detailed error
  throw new Error(`🚫 Smart selector failed to find any elements with selector: "${selector}"\n` +
    `Tried strategies: ${strategies.map(s => `${s.type}:"${s.selector}"`).join(', ')}`);
}

/**
 * Smart click - works with any selector type
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} selector - Any type of selector (XPath, CSS, text, etc.)
 * @param {number} [index=0] - Index of element if multiple matches
 */
async function click(page, selector, index = 0) {
  try {
    console.log(`🎯 Smart Click: "${selector}" (index: ${index})`);
    
    // Use smart finder to get elements
    const elements = await smartFind(page, selector, 'click');
    
    if (index >= elements.length) {
      throw new Error(`Index ${index} out of range. Found ${elements.length} elements.`);
    }
    
    // Click the element at specified index
    await elements[index].click();
    console.log(`✅ Successfully clicked element at index ${index}`);
    
    // Wait a bit for any animations/loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error(`🚫 Smart Click failed for "${selector}":`, error.message);
    throw error;
  }
}

/**
 * Smart type - works with any selector type
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} selector - Any type of selector (XPath, CSS, text, etc.)
 * @param {string} text - Text to type
 */
async function type(page, selector, text) {
  try {
    console.log(`⌨️ Smart Type: "${selector}" → "${text}"`);
    
    // Use smart finder to get elements
    const elements = await smartFind(page, selector, 'type');
    const element = elements[0];
    
    // Clear existing text and type new text
    await element.click({ clickCount: 3 }); // Select all text
    await element.type(text);
    console.log(`✅ Successfully typed text into element`);
    
    // Wait a bit for any event handlers
    await new Promise(resolve => setTimeout(resolve, 300));
    
  } catch (error) {
    console.error(`🚫 Smart Type failed for "${selector}":`, error.message);
    throw error;
  }
}

/**
 * Smart element existence check - works with any selector type
 * @param {import('puppeteer').Page} page - Puppeteer page instance  
 * @param {string} selector - Any type of selector
 * @returns {Promise<boolean>} True if element exists
 */
async function elementExists(page, selector) {
  try {
    console.log(`🔍 Smart Exists Check: "${selector}"`);
    const elements = await smartFind(page, selector, 'exists');
    const exists = elements.length > 0;
    console.log(`✅ Element ${exists ? 'exists' : 'not found'}`);
    return exists;
  } catch (error) {
    console.log(`❌ Element does not exist: "${selector}"`);
    return false;
  }
}

/**
 * Smart get text - works with any selector type
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} selector - Any type of selector
 * @returns {Promise<string>} Text content of the element
 */
async function getText(page, selector) {
  try {
    console.log(`📝 Smart Get Text: "${selector}"`);
    const elements = await smartFind(page, selector, 'getText');
    
    const textContent = await elements[0].evaluate(el => el.textContent);
    const result = textContent || '';
    console.log(`✅ Extracted text: "${result}"`);
    return result;
    
  } catch (error) {
    console.error(`🚫 Smart Get Text failed for "${selector}":`, error.message);
    throw error;
  }
}

/**
 * Smart get attribute - works with any selector type
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} selector - Any type of selector
 * @param {string} attribute - Attribute name
 * @returns {Promise<string>} Attribute value
 */
async function getAttribute(page, selector, attribute) {
  try {
    console.log(`🏷️ Smart Get Attribute: "${selector}" → ${attribute}`);
    const elements = await smartFind(page, selector, 'getAttribute');
    
    const attrValue = await elements[0].evaluate((el, attr) => el.getAttribute(attr), attribute);
    const result = attrValue || '';
    console.log(`✅ Extracted attribute "${attribute}": "${result}"`);
    return result;
    
  } catch (error) {
    console.error(`🚫 Smart Get Attribute failed for "${selector}" (${attribute}):`, error.message);
    throw error;
  }
}

// CommonJS exports
module.exports = { click, type, elementExists, getText, getAttribute };