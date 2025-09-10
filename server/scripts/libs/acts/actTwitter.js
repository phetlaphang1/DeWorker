import fs from "fs";
import speakeasy from "speakeasy";
import * as act from "../act.js";

const xpathTweet = "//article[@data-testid='tweet']";

export async function loginTwitter(page, config) {
    await page.goto("https://x.com");
    
    if (await isLoggedIn(page)) {
        return true;
    }
    
    const twitterUsername = config.profile.customField?.twitter_account?.username;
    const twitterPassword = config.profile.customField?.twitter_account?.password;
    const twitterEmail = config.profile.customField?.twitter_account?.email;
    const twitter2FA = config.profile.customField?.twitter_account?.["2fa"];
    const cookies = config.profile.customField?.twitter_account?.cookies;

    if (cookies) {
        await page.deleteCookie();
        await page.setCookie(...cookies);
        await page.goto("https://x.com");

        if (await isLoggedIn(page)) {
            return true;
        }
    } 

    if (!(await isLoggedIn(page))) {
        await page.goto("https://x.com/i/flow/login");        
        await act.type(
            page,
            "//input[@autocomplete='username']",
            twitterUsername,
        );

        await act.click(page, "//span[text()='Next']");
        const xpathEmail = "//*[contains(text(), 'Email')]";
        const xpathPassword = "//*[contains(text(), 'Password')]";
        if ( await act.waitForTrueElement(page, 20, xpathEmail, xpathPassword)) {
            await act.type(page, "//input[@autocomplete='on']", twitterEmail);
            await act.pause(3000);
            await act.click(page, "//span[text()='Next']");
        }
        console.log("Checking 01 .....");
        await act.pause(3000);
        await act.type(
            page,
            "//input[@autocomplete='current-password']",
            twitterPassword,
        );

        console.log("Checking 02 .....");
        await act.click(page, "//span[text()='Log in']");

        await act.pause(3000);

        for (let index = 0; index < 20; index++) {
            if (await act.checkElement(page, "//span[text()='Home']")) {
                break;
            }
            if (await act.checkElement(page, "//input[@autocomplete='on']")) {
                const token = speakeasy.totp({
                    secret: twitter2FA,
                    encoding: "base32",
                });
                await act.type(page, "//input[@autocomplete='on']", token);
                await act.click(page, "//span[text()='Next']");
                break;
            }
        }
    }

    if (await isLoggedIn(page)) {
        return true;
    } else {
        return false;
    }

    // if (cookie) {
    //     await control.saveCookie(page, "./data_input/cookies.json");
    // }
}

export async function isLoggedIn(page) {
    return await act.waitForTrueElement(
        page,
        20,
        "//a[@href='/home' and @aria-label='X']",
        "//span[text()='Sign in']",
    );
}

export async function getAllPostsInPage(page) {
    return await page.evaluate(() => {
        const playlists = []; // Store objects with name and link

        const playlistElements = document.querySelectorAll("article");

        playlistElements.forEach((el) => {
            const anchor01 = el.querySelector("a:has(time)");
            if (anchor01 && anchor01.href) {
                playlists.push({
                    // name: anchor01.innerText.trim(),
                    link: anchor01.href,
                });
            }
        });

        const uniquePlaylists = Array.from(
            new Map(playlists.map((p) => [p.link, p])).values(),
        );
        return uniquePlaylists;
    });
}

export async function getPostURLByIndex(page, index) {
    const xpathHref = "//a[contains(@href,'/status/') and time]";
    const tweetURL = await act.getAttribute(
        page,
        xpathTweet + xpathHref,
        "href",
        index,
    );
    console.log(tweetURL);
}

export function getHrefFromPostURL(url){
    let href = url.replace("https://x.com", "");
    href = href.replace("https://twitter.com", "");
    return href
}
export function getInfoFromPostURL(url) {
    try {
        // Regular expression to match the pattern /username/status/postId
        // Group 1 captures the username, Group 2 captures the status ID.
        const regex = /\/([a-zA-Z0-9_]+)\/status\/(\d+)/;
        const match = url.match(regex);

        if (match && match.length === 3) {
            const username = match[1];
            const postId = match[2];
            return { username, postId };
        } else {
            console.warn("URL format not recognized for extraction:", url);
            return null;
        }
    } catch (error) {
        console.error("Error parsing URL:", error);
        return null;
    }
}

export async function gotoPostFromURL(page, postURL){
    await act.click(page, "//a[@href='/explore']");
    await act.pause(2000);
    const info = getInfoFromPostURL(postURL);
    await act.type(page, "//input[@placeholder='Search']", info.username);
    await act.pause(2000);
    await act.click(page, `//span[text()='@${info.username}']`);
    await act.pause(2000);
    const  NO_SCROLL = 2;
    for (let index = 0; index < NO_SCROLL; index++) {
        const xpathPost = `//a[contains(@href,'${info.username}/status/${info.statusId}')]`
        if(await act.checkElement(page, xpathPost)){
            await act.click(page, xpathPost);            
            await act.pause(2000);
            return true;
        }else{
            await act.scrollToEndOfPage(page);
            await act.pause(1000);
        }
    }

    await act.click(page, "//span[text()='Replies']");
    await act.pause(2000);
    
    for (let index = 0; index < NO_SCROLL; index++) {
        const xpathPost = `//a[contains(@href,'${info.username}/status/${info.statusId}')]`
        if(await act.checkElement(page, xpathPost)){
            await act.click(page, xpathPost);            
            await act.pause(2000);            
            return true;
        }else{
            await act.scrollToEndOfPage(page);
            await act.pause(1000);
        }
    }

    await page.goto(postURL);              
    return false;
}

export async function getNewPostID(page){
    const response = await page.waitForResponse(response => response.url().includes("CreateTweet"));
    const responseBody = await response.json();
    try{
    postId = responseBody.data.create_tweet.tweet_results.result.rest_id;  
    console.log("Post ID: ", postId);
    return postId;
    }catch(error){
    message = responseBody.errors.message;
    throw new Error(message); 
    }  
}
  
  