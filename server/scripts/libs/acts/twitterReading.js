import * as gen from "#gen";
import * as act from "#act";
import * as twt from "#actTwitter";
import { loadConfigFromFile } from "vite";

// const default_post_url = "https://x.com/ai_artworkgen/status/1958102908504780853";
const default_post_url = "https://x.com/eyishazyer/status/1961395568712012122";
let res = {}; 
export async function twtReading(page, config) {     
    // Before     
    setupRes(config);
    await twt.loginTwitter(page, config);
    
    // Body
    await page.goto(res.post_url);
    await readContentOfPost(page);
               
    await gen.updateResult(res, "twitterReading.json");   

    // After            
    const N8N_ROXANE_URL = 'https://n8n.roxane.one/webhook/3af47a61-00c2-4233-a4c8-54ef3c7644e1';                               
    res.post_result = await gen.postToWebhook(N8N_ROXANE_URL, res);
    
    return res;
}

function setupRes(config){
    if(config.type == "task"){
        const req = gen.getRequestFromConfig(config);
        
        console.log(req.URL);
        res.post_url = req.URL;
        console.log(res.post_url);
    }else{
        res.post_url = default_post_url;
    }

    res.post_author = (twt.getInfoFromPostURL(res.post_url)).username;
}

async function readContentOfPost(page) {           
    const info = twt.getInfoFromPostURL(res.post_url);
    const xpathPost = "//div[div[div[div[div[div[a[contains(@href,'/status/" + info.postId + "')]]]]]]]";
    const xpathPostText = xpathPost + "//div[@data-testid='tweetText']";
    const xpathPostRichText = xpathPost + "//div[@data-testid='twitterArticleRichTextView']";
    const xpathPostImge = xpathPost + "//img[contains(@src,'twimg.com/media')]";  
    const xpathPostTime = xpathPost + "//a[contains(@href,'/status/" +  info.postId + "')]/time";
    
    let tweetTextDiv;
    if(await act.waitForTrueElement(page, 30, xpathPostText, xpathPostRichText)){
        // res.post_content = await act.getAttribute(page, xpathPostText, "innerText");
        tweetTextDiv = await act.getElement(page, xpathPostText);
        if (tweetTextDiv) {
            const combinedText = await page.evaluate((el) => {
              // Find all direct children that are span or img tags
              const elements = Array.from(el.children);
              let extractedText = '';
        
              elements.forEach(child => {
                if (child.tagName === 'SPAN') {
                  // Add text from span element
                  extractedText += child.textContent.trim() + ' ';
                } else if (child.tagName === 'IMG') {
                  // Add alt attribute from img element
                  const altText = child.getAttribute('alt');
                  if (altText) {
                    extractedText += altText + ' ';
                  }
                }
              });
              return extractedText.trim();
            }, tweetTextDiv);
        
            console.log(combinedText);
            res.post_content = combinedText;
          } else {
            console.log('Tweet text div not found.');
          }    
    }else{
        res.post_content = await act.getAttribute(page, xpathPostRichText, "innerText");
        // tweetTextDiv = await act.getElement(page, xpathPostRichText);
    }
    
   
    res.post_image_url = await act.getAttributes(page, xpathPostImge,"src");
    res.post_time = await act.getAttribute(page, xpathPostTime,"innerText");
}