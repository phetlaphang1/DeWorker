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
        // Wait for element to be clickable
        await page.waitForSelector(`::-p-xpath(${xpath})`, {
            timeout: 5000,
            visible: true
        }).catch(() => {
            console.log(`⏳ Element not immediately clickable, trying anyway...`);
        });

        const element = await getElement(page, xpath, index);
        if (!element) {
            throw new Error(`Element not found: ${xpath}`);
        }

        // Scroll element into view before clicking
        await element.evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // Small delay to ensure element is ready
        await pause(500);

        await element.click();
        console.log(`✅ Clicked element: ${xpath}`);
        return true;
    } catch (error) {
        console.log("❌ Click failed for: " + xpath + " - " + error.message);
        return false;
    }
}

export async function type(page, xpath, text) {
    console.log("Type: " + text + " in " + xpath);
    try {
        const element = await page.waitForSelector("::-p-xpath(" + xpath + ")", {
            timeout: 5000,
            visible: true
        });

        // Clear existing text first
        await element.click({ clickCount: 3 });
        await element.press('Backspace');

        // Type new text with slight delay between characters
        await element.type(text, { delay: 50 });
        console.log(`✅ Typed text in: ${xpath}`);
    } catch (error) {
        console.error(`❌ Type failed for "${xpath}":`, error.message);
        throw error;
    }
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
 * Wait for an element to appear using XPath
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector
 * @param {number} timeout - Maximum wait time in ms (default: 10000)
 * @returns {Promise<boolean>} True if element appears
 */
export async function waitForElement(page, xpath, timeout = 10000) {
    try {
        console.log(`⏳ Waiting for element: "${xpath}" (timeout: ${timeout}ms)`);
        await page.waitForSelector(`::-p-xpath(${xpath})`, {
            timeout: timeout,
            visible: true
        });
        console.log(`✅ Element appeared: "${xpath}"`);
        return true;
    } catch (error) {
        console.log(`⚠️ Element did not appear within ${timeout}ms: "${xpath}"`);
        return false;
    }
}

/**
 * Wait for page navigation to complete
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {Function} actionFn - Function that triggers navigation
 * @param {number} timeout - Maximum wait time in ms (default: 30000)
 * @returns {Promise<void>}
 */
export async function waitForNavigation(page, actionFn, timeout = 30000) {
    try {
        console.log(`🚀 Waiting for navigation...`);
        await Promise.all([
            page.waitForNavigation({
                waitUntil: ['networkidle2', 'domcontentloaded'],
                timeout: timeout
            }),
            actionFn()
        ]);
        console.log(`✅ Navigation completed`);
    } catch (error) {
        console.log(`⚠️ Navigation timeout or error:`, error.message);
    }
}

/**
 * Scroll to an element using XPath
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector
 * @returns {Promise<boolean>} True if scroll successful
 */
export async function scrollToElement(page, xpath) {
    try {
        console.log(`🔄 Scrolling to element: "${xpath}"`);
        const elements = await page.$$("xpath/" + xpath);

        if (elements.length === 0) {
            console.log(`⚠️ Element not found for scrolling: "${xpath}"`);
            return false;
        }

        await elements[0].evaluate(el => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // Wait a bit for scroll to complete
        await pause(1000);
        console.log(`✅ Scrolled to element: "${xpath}"`);
        return true;
    } catch (error) {
        console.error(`❌ Scroll failed for "${xpath}":`, error.message);
        return false;
    }
}

/**
 * Get value from an input element
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector
 * @returns {Promise<string>} Input value
 */
export async function getValue(page, xpath) {
    try {
        console.log(`📝 Get Value: "${xpath}"`);
        const elements = await page.$$("xpath/" + xpath);

        if (elements.length === 0) {
            throw new Error(`No element found with XPath: ${xpath}`);
        }

        const value = await elements[0].evaluate(el => el.value || '');
        console.log(`✅ Got value: "${value}"`);
        return value;
    } catch (error) {
        console.error(`🚫 Get Value failed for "${xpath}":`, error.message);
        throw error;
    }
}

/**
 * Select option from dropdown
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector for select element
 * @param {Object} option - Selection option {value, text, or index}
 * @returns {Promise<boolean>} True if selection successful
 */
export async function select(page, xpath, option) {
    try {
        console.log(`📦 Select from dropdown: "${xpath}"`);
        const elements = await page.$$("xpath/" + xpath);

        if (elements.length === 0) {
            throw new Error(`No select element found with XPath: ${xpath}`);
        }

        if (option.value !== undefined) {
            await elements[0].select(option.value);
            console.log(`✅ Selected by value: "${option.value}"`);
        } else if (option.text !== undefined) {
            // Select by visible text
            await elements[0].evaluate((el, text) => {
                const options = el.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].text === text) {
                        el.selectedIndex = i;
                        break;
                    }
                }
            }, option.text);
            console.log(`✅ Selected by text: "${option.text}"`);
        } else if (option.index !== undefined) {
            await elements[0].evaluate((el, idx) => {
                el.selectedIndex = idx;
            }, option.index);
            console.log(`✅ Selected by index: ${option.index}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ Select failed for "${xpath}":`, error.message);
        return false;
    }
}

/**
 * Get text content from an element using XPath
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} xpath - XPath selector
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<string>} Text content of the element
 */
export async function getText(page, xpath, maxRetries = 3, retryDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📝 Get Text: "${xpath}" (attempt ${attempt}/${maxRetries})`);

            // Wait for the element to be present
            await page.waitForSelector(`::-p-xpath(${xpath})`, {
                timeout: 5000
            }).catch(() => {
                console.log(`⏳ Element not immediately available, checking...`);
            });

            // Try to get elements
            const elements = await page.$$("xpath/" + xpath);

            if (elements.length === 0) {
                throw new Error(`No element found with XPath: ${xpath}`);
            }

            // Extract text with error handling for stale elements
            const textContent = await elements[0].evaluate(el => {
                // Handle different element types
                if (!el) return '';
                // Try to get text from value (for inputs) or textContent
                return el.value || el.textContent || el.innerText || '';
            }).catch(evalError => {
                // If evaluation fails due to navigation, return null to retry
                if (evalError.message.includes('Execution context was destroyed')) {
                    return null;
                }
                throw evalError;
            });

            // If we got null, the context was destroyed, retry
            if (textContent === null) {
                throw new Error('Execution context was destroyed during evaluation');
            }

            const result = textContent.trim();
            console.log(`✅ Extracted text: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`);
            return result;

        } catch (error) {
            lastError = error;
            console.error(`⚠️ Get Text attempt ${attempt} failed for "${xpath}":`, error.message);

            if (attempt < maxRetries) {
                console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
                await pause(retryDelay);

                // Check if page still exists and is not closed
                try {
                    await page.evaluate(() => true);
                } catch (pageError) {
                    console.error(`❌ Page is closed or navigated away`);
                    throw new Error('Page is no longer available');
                }
            }
        }
    }

    console.error(`🚫 Get Text failed after ${maxRetries} attempts for "${xpath}"`);
    throw lastError;
}

export async function demo(page, config) {
    try {
        // Navigate to website
        await page.goto("https://tinhte.vn/", {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });
        console.log("Page title:", await page.title());

        // Wait for the article link to be present and click it
        const articleXPath = "//*[@id=\"__next\"]/div[1]/div[1]/div[2]/div/div/div[1]/div[1]/ol/li[1]/div[2]/article/div/h4/a";
        await waitForElement(page, articleXPath, 10000);

        // Click with navigation wait
        await waitForNavigation(page, async () => {
            await click(page, articleXPath, 0);
        });

        // Wait for page to fully load after navigation
        await pause(3000);

        // Try multiple XPath variations for the article content
        const xpathVariations = [
            "//*[@id=\"__next\"]/div[1]/div/div[2]/div[2]/div[1]/div/div/div[1]/main/article/div/div/div[1]/div[1]/span[1]",
            "//*[@id=\"__next\"]/div[1]/div/div[2]/div[2]/div[1]/div/div/div[1]/main/article/div/div/div/div/span[1]",
            "//main/article//span[1]",
            "//article//div[@class='content']//span[1]",
            "//article//p[1]"
        ];

        let extractedData = "";
        let extractSuccess = false;

        // Try each XPath variation
        for (const xpath of xpathVariations) {
            try {
                console.log(`🎯 Trying XPath: ${xpath}`);
                extractedData = await getText(page, xpath, 1, 500); // Only 1 retry per variation
                if (extractedData && extractedData.trim()) {
                    extractSuccess = true;
                    break;
                }
            } catch (error) {
                console.log(`⚠️ XPath didn't work: ${xpath}`);
            }
        }

        if (!extractSuccess) {
            console.log("⚠️ Could not extract article content, using fallback");
            // Try to get any text from the article
            try {
                extractedData = await page.evaluate(() => {
                    const article = document.querySelector('article');
                    if (article) {
                        const firstParagraph = article.querySelector('p') || article.querySelector('span') || article.querySelector('div');
                        return firstParagraph ? firstParagraph.textContent : 'No content found';
                    }
                    return 'Article not found';
                });
            } catch (evalError) {
                extractedData = "Failed to extract article content";
            }
        }

        console.log("Extracted text into 'extractedData':", extractedData.substring(0, 200) + "...");

        // Assign variable from extractedData to data
        const data = extractedData;
        console.log("Assigned 'data':", data.substring(0, 100) + "...");

        // AI Request to Roxane API
        const apiResponse = await (async () => {
            const axios = (await import('axios')).default;

            // Prepare the message with the extracted data
            const userMessage = `Please create a thoughtful comment for this post: ${data}`;

            const requestConfig = {
                method: "POST",
                url: "https://llmapi.roxane.one/v1/chat/completions",
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer linh-1752464641053-phonefarm'
                },
                data: {
                    "model": "text-model",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a social media user. Create ONE natural, authentic comment for posts. Rules:\n- Write ONLY the comment text, nothing else\n- No quotes, no explanation, no formatting\n- Be conversational and genuine\n- Keep it short (1-2 sentences max)\n- Write in Vietnamese or English based on the post language\n- Never use brackets, asterisks, or special formatting"
                        },
                        {
                            "role": "user",
                            "content": userMessage
                        }
                    ],
                    "temperature": 0.9,
                    "max_tokens": 100
                }
            };

            try {
                console.log('🚀 Making AI request to Roxane API...');
                const response = await axios(requestConfig);
                let aiResponse = response.data.choices[0].message.content;

                // Clean the AI response
                aiResponse = aiResponse.trim();
                // Remove quotes if wrapped
                aiResponse = aiResponse.replace(/^["']|["']$/g, '');
                // Remove common prefixes AI might add
                aiResponse = aiResponse.replace(/^(Comment:|Response:|Here is|Here's|Answer:)\s*/i, '');
                // Remove markdown bold/italic
                aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '$1');
                aiResponse = aiResponse.replace(/__(.*?)__/g, '$1');
                aiResponse = aiResponse.replace(/\*(.*?)\*/g, '$1');
                aiResponse = aiResponse.replace(/_(.*?)_/g, '$1');
                // Remove brackets if any
                aiResponse = aiResponse.replace(/^\[|\]$/g, '');
                aiResponse = aiResponse.replace(/^\(|\)$/g, '');

                console.log('✅ AI Response (cleaned):', aiResponse);
                return aiResponse;
            } catch (error) {
                console.error('❌ AI Request failed:', error.message);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                throw error;
            }
        })();

        console.log('AI response stored in variable: apiResponse');
        return { success: true, data: apiResponse };

    } catch (error) {
        console.error('❌ Demo execution failed:', error.message);
        // Take screenshot on error
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            await page.screenshot({
                path: `./error-screenshot-${timestamp}.png`,
                fullPage: true
            });
            console.log(`📸 Error screenshot saved`);
        } catch (screenshotError) {
            console.error('Failed to take screenshot:', screenshotError.message);
        }
        throw error;
    }
}