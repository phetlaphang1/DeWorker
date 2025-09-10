import puppeteer from "puppeteer";
import speakeasy from "speakeasy";

export async function pause(time) {
    console.log("Pause in " + time + " milliseconds...");
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

export async function click(page, xpath, index = null) {
    console.log("Click: " + xpath);
    try {
        const element = await getElement(page, xpath, index);
        await element.click();
        return true;
    } catch (error) {
        console.log("Not present: " + xpath);
        return false;
    }
}

export async function type(page, xpath, text) {
    console.log("Type: " + text + " in " + xpath);
    const element = await page.waitForSelector("::-p-xpath(" + xpath + ")");
    await element.type(text);
}

export async function scrollToEndOfPage(page) {
    const prevHeight = await page.evaluate("document.documentElement.scrollHeight");
    await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
    await page
        .waitForFunction(`document.documentElement.scrollHeight > ${prevHeight}`, {
            timeout: 10000,
        })
        .catch(() => console.log("No new content loaded or scroll timeout."));
    await pause(2000);
    const postHeight = await page.evaluate("document.documentElement.scrollHeight");
    console.log("Scroll down with height from: " + prevHeight + " to: " + postHeight);
    return { prevHeight, postHeight };
}

export async function scrollToHomeOfPage(page) {
    const prevHeight = await page.evaluate("document.documentElement.scrollHeight");
    await page.evaluate("window.scrollTo(0, 0)");
    await pause(2000);
    const postHeight = await page.evaluate("document.documentElement.scrollHeight");
    console.log("Scroll up with height from: " + prevHeight + " to: " + postHeight);
    return { prevHeight, postHeight };
}

export async function checkElement(page, xpath) {
    try {
        await page.waitForSelector("::-p-xpath(" + xpath + ")", {
            timeout: 1000,
        });
        return true;
    } catch (error) {
        return false;
    }
}

export async function waitForTrueElement(page, time, xpathTrue, xpathFalse) {
    let presented = false;

    for (let index = 0; index < time; index++) {
        if (await checkElement(page, xpathTrue)) {
            presented = true;
            break;
        }
        if (await checkElement(page, xpathFalse)) {
            presented = false;
            break;
        }
    }
    if (presented) {
        console.log("Present: " + xpathTrue);
    } else {
        console.log("Not Present: " + xpathTrue);
    }

    return presented;
}

export async function getElements(page, xpath) {
    const elements = await page.$$("xpath/" + xpath);    
    return elements;
}

export async function getElement(page, xpath, index = null) {
    const elements = await page.$$("xpath/" + xpath);
    return elements[index || 0];
}

export async function getAttributes(page, xpath, attributeName) {
    let attributes = [];
    const elements = await getElements(page, xpath);
    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        const propertyHandle = await element.getProperty(attributeName);
        const propertyValue = await propertyHandle.jsonValue();
        attributes.push(propertyValue);
    }
    return attributes;
}

export async function getAttribute(page, xpath, attributeName, index = null) {    
    const elements = await getElements(page, xpath);
    const element = elements[index || 0];
    const propertyHandle = await element.getProperty(attributeName);
    const propertyValue = await propertyHandle.jsonValue();
    return propertyValue;    
}

/**
 * Check if an element exists using XPath
 * @param {import('puppeteer').Page} page - Puppeteer page instance  
 * @param {string} xpath - XPath selector
 * @returns {Promise<boolean>} True if element exists
 */
export async function elementExists(page, xpath) {
    try {
        console.log(`🔍 Check if element exists: "${xpath}"`);
        const elements = await page.$$("xpath/" + xpath);
        const exists = elements.length > 0;
        console.log(`✅ Element ${exists ? 'exists' : 'not found'}`);
        return exists;
    } catch (error) {
        console.log(`❌ Element does not exist: "${xpath}"`);
        return false;
    }
}

/**
 * Get text content from an element using XPath
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector
 * @returns {Promise<string>} Text content of the element
 */
export async function getText(page, xpath) {
    try {
        console.log(`📝 Get Text: "${xpath}"`);
        const elements = await page.$$("xpath/" + xpath);
        
        if (elements.length === 0) {
            throw new Error(`No element found with XPath: ${xpath}`);
        }
        
        const textContent = await elements[0].evaluate(el => el.textContent);
        const result = textContent || '';
        console.log(`✅ Extracted text: "${result}"`);
        return result;
    } catch (error) {
        console.error(`🚫 Get Text failed for "${xpath}":`, error.message);
        throw error;
    }
}
