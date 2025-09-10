import puppeteer from "puppeteer";
import useProxy from "@lem0-packages/puppeteer-page-proxy";
import https from "https";
import http from "http";
import fs from "fs";

export async function setupProxy(page, proxyHost) {
    console.log(proxyHost);
    await useProxy(page, proxyHost);
    await page.goto("https://www.whatismyip.com/");
}

export async function loadCookie(page, filePathOfCookie) {
    // Load cookies from file
    const storedCookies = fs.readFileSync(filePathOfCookie);
    const cookies = JSON.parse(storedCookies);
    console.log("Cookies: " + cookies);
    await page.setCookie(...cookies);
    return cookies;
    // Set cookies for the page session
}

export async function loadCookieFromConfig(page, filePathOfCookie) {
    try {
        const configData = fs.readFileSync(filePathOfCookie, "utf8");
        const profileData = JSON.parse(configData);
        const cookies = profileData.customField?.twitter_account?.cookies;
        console.log("Cookies: " + cookies);
        await page.setCookie(...cookies);
        return cookies;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function saveCookie(page, filePath) {
    // Extract cookies
    const cookies = await page.cookies();

    // Serialize cookies
    const serializedCookies = JSON.stringify(cookies);
    fs.writeFileSync(filePath, serializedCookies);

    console.log(`Cookies saved to: ${filePath}`);
}

