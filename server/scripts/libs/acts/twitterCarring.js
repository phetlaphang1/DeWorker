import * as fs from 'fs';
import * as gen from "#gen";
import * as roxaneAI from "#rai";
import * as act from "#act";
import * as twt from "#actTwitter";

const ACT_RATE = [40, 60, 80];

// const TIME_FOR_NEXT_ROUND = [60, 240];
const TIME_FOR_NEXT_ROUND = [10, 5];
let res = {
    profileId: "",
    username: "",
    actionType: "",    
    postURL: "",
    newPostId: "",
    newPostURL: "",
    status: "FAIL",
    details: "",    
};

export async function twitterCarring(page, config){         
    // Before     
    await twt.loginTwitter(page, config);
    
    // Body
    await scrollDownAndUpRandomly(page);    
    res.postURL = await selectTweetRandomly(page);   
    res.actionType = getActionRandomly(ACT_RATE);
    switch (res.actionType) {
        case 0:
            res.actionType = "like";
            await likeTweet(page);
            break;
        case 1:
            res.actionType = "repost";
            await repostTweet(page);
            break;
        case 2:
            res.actionType = "quote";
            await quoteTweet(page);
            break;
        case 3:
            res.actionType = "reply";
            await replyTweet(page);
            break;
        default:
            break;
    }
    await waitForNextRound(page, TIME_FOR_NEXT_ROUND);   
           
    // After    
    res.profileId = config.profileId;
    res.username = config.profile.customField?.twitter_account?.username;    
    if(res.newPostId){
        res.newPostURL = `https://twitter.com/${res.username}/status/${postId}`;
        res.status = "PASS";
    }
    await gen.updateResult(res, "twitterCarring.json");
    return res;
}

async function scrollDownAndUpRandomly(page) {
    await act.pause(2000);
    await act.scrollToEndOfPage(page);
    const moreScrolls = Math.floor(5 * Math.random());
    console.log("Number of next scroll down and up as: " + moreScrolls);
    for (let index = 0; index < moreScrolls; index++) {
        const typeOfScroll = Math.random();
        if (typeOfScroll < 0.5) {
            await act.scrollToEndOfPage(page);
        } else {
            await act.scrollToHomeOfPage(page);
        }
    }
}

async function selectTweetRandomly(page) {
    await act.pause (3000);
    const xpathTweet = "//a[contains(@href,'/status/') and time]"
    const elements = await page.$$("xpath/" + xpathTweet);
    const tweetIndex = Math.floor(elements.length * Math.random());
    console.log("Selected " + (tweetIndex + 1) + " in total of " + elements.length + " tweets randomly");
    const tweetPost = elements[tweetIndex];
    const propertyHandle = await tweetPost.getProperty("href");
    const postURL = await propertyHandle.jsonValue();
    await tweetPost.click();
   
    await act.pause(3000);
    if (postURL == (await page.url())){
        console.log(postURL);
        return postURL;
    };
    res.details = "Can not select tweet";
}

function getActionRandomly(actRate) {
    const randomNo = Math.floor(100 * Math.random());
    if (randomNo < actRate[0]) {
        console.log("Choose action as 'like' randomly");
        return 0; //like
    } else {
        if (randomNo < actRate[1]) {
            console.log("Choose action as 'repost' randomly");
            return 1; //repost
        } else {
            if (randomNo < actRate[2]) {
                console.log("Choose action as 'quote' randomly");
                return 2; //quote
            } else {
                console.log("Choose action as 'reply' randomly");
                return 3; //reply
            }
        }
    }
}

async function likeTweet(page) {
    try {
        const xpathLikeTweet = "//div[div[@data-testid='inline_reply_offscreen']]//button[@data-testid='like']";
        await act.click(page, xpathLikeTweet);
        await act.pause(1000);
        res.status = "PASS";
        res.details = "Tweet liked successfully";
    } catch (error) {
        res.status = "FAIL";
        res.details = `Failed to like tweet: ${error.message}`;
    }
}

async function repostTweet(page) {
    try {
        const xpathRetweetTweet = "//div[div[@data-testid='inline_reply_offscreen']]//button[@data-testid='retweet']";
        const xpathRepostTweet = "//span[text()='Repost']";

        await act.click(page, xpathRetweetTweet);
        await act.click(page, xpathRepostTweet);
        await act.pause(1000);
        res.status = "PASS";
        res.details = "Tweet reposted successfully";
    } catch (error) {
        res.status = "FAIL";
        res.details = `Failed to repost tweet: ${error.message}`;
    }
}

async function quoteTweet(page) {
    try {
        const xpathTweetText = "//div[div[@data-testid='inline_reply_offscreen']]//div[@data-testid='tweetText']";
        const xpathRetweetTweet = "//div[div[@data-testid='inline_reply_offscreen']]//button[@data-testid='retweet']";
        const xpathQuoteTweet = "//span[text()='Quote']";
        const xpathComment = "//div[div[text()='Add a comment']]";
        const tweetText = await act.getAttribute(page, xpathTweetText,"innerText");
        await act.click(page, xpathRetweetTweet);
        await act.click(page, xpathQuoteTweet);    
        
        const reply = await roxaneAI.getCommentByAI(tweetText);
        if(reply.result.status == "SUCCESS") {
            await act.type(page, xpathComment, reply.result.comment);
            await act.click(
                page,
                "//button[@data-testid='tweetButton']/div/span/span[text()='Post']",
            );
            
            res.newPostId = await twt.getNewPostID(page);  
            res.details = reply.result.comment;
        }else{
            res.details = reply.result.reasoning;
        }
        
       
    } catch (error) {
        res.status = "FAIL";
        res.details = `Failed to quote tweet: ${error.message}`;
    }
}

async function replyTweet(page) {
    try {
        const xpathTweetText = "//div[div[@data-testid='inline_reply_offscreen']]//div[@data-testid='tweetText']";
        const xpathReplyTweet = "//button[@data-testId='reply']";
        const tweetText = await act.getAttribute(page, xpathTweetText,"innerText");
        await act.click(page, xpathReplyTweet);    
        const reply = await roxaneAI.getCommentByAI(tweetText);
        if(reply.result.status == "SUCCESS") {
            await act.type(page, "//div[@data-testid='tweetTextarea_0']", reply.result.comment);
            await act.click(page, "//button/div/span/span[text()='Reply']");
            await act.pause(1000);
            res.newPostId = await twt.getNewPostID(page);  
            res.details = reply.result.comment;
        } else {
            res.details = reply.result.reasoning;
        }
    } catch (error) {
        res.status = "FAIL";
        res.details = `Failed to reply to tweet: ${error.message}`;
    }
}

async function waitForNextRound(page, timeForNextRound) {
    await act.pause(2000);
    await act.scrollToHomeOfPage(page);    
    const waitingTime = timeForNextRound[0] + Math.floor(timeForNextRound[1] * Math.random());    
    console.log("Waiting for next round in " + waitingTime + " seconds...");
    await act.pause(waitingTime * 1000);
}

