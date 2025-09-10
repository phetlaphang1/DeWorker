import puppeteer from "puppeteer";
import useProxy from "@lem0-packages/puppeteer-page-proxy";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
// fetch is available globally in Node.js v18+ (native support)

export function getRequestFromConfig(config){
    let jsonConfig = config;
    let request;
    try{
        jsonConfig = JSON.parse(config)
    }catch(e){
        // console.log(e);
    }

    request = jsonConfig.task.request;

    try{
        request = JSON.parse(request)
    }catch(e){
        // console.log(e);
    }

    return request;
}

export async function takeScreen(page, filePath) {
    await page.screenshot({
        path: filePath,
        fullPage: true,
    });
}

export async function saveFileFromURL(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = url.startsWith("https") ? https : http;

        request
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    resolve();
                });

                file.on("error", (err) => {
                    fs.unlink(filepath, () => {}); // Delete the file on error
                    reject(err);
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });
}

export async function deleteFile(filepath) {
    if (!filepath) return;
    return new Promise((resolve, reject) => {
        fs.unlink(filepath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export async function postToWebhook(url, postData) {
    try {                          
        console.log("Posting to webhook:", url);
        console.log("Post data:", JSON.stringify(postData, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        // Log response details
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        // Check if the request was successful
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            let data;
            
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
                // console.log("Response data (JSON):", JSON.stringify(data, null, 2));
            } else {
                data = await response.text();
                // console.log("Response data (Text):", data);
            }
            
            console.log(`✓ Webhook post successful`);
            return {
                success: true,
                // status: response.status,
                // data: data
            };
        } else {
            const errorText = await response.text();
            console.error('✗ Webhook post failed');
            console.error('Status:', response.status);
            console.error('Error response:', errorText);
            return {
                success: false,
                // status: response.status,
                error: errorText
            };
        }
          
    } catch (error) {
        console.error('✗ Webhook post error - fetch failed');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message,
            errorType: error.name
        };
    }
}

export async function updateResult(res, filename){
    const jsonFilePath = path.join(process.cwd(),"../", "../",  filename);
    try {
        // Path to the JSON file in the local directory        
        console.log(jsonFilePath);
        
        // Read existing data or create empty structure
        let existingData = { entries: [] };
        try {
            const fileContent = await fs.promises.readFile(jsonFilePath, 'utf8');
            existingData = JSON.parse(fileContent);
            
            // Ensure entries array exists
            if (!existingData.entries) {
                existingData.entries = [];
            }
        } catch (error) {
            // File doesn't exist or is invalid, use default structure
            console.log(`Creating new ${filename} file`);
        }
        
        // Append the new result
        existingData.entries.push({
            timestamp:new Date().toISOString(),
            ...res
        });
        
        // Write back to file
        await fs.promises.writeFile(jsonFilePath, JSON.stringify(existingData, null, 2), 'utf8');
        console.log(`Result appended to ${filename} successfully`);
        
    } catch (error) {
        console.error(`Failed to update ${filename}:`, error);
    }
}
