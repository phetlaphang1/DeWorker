import path from "path";
import * as gen from "#gen";
import * as act from "#act";
import * as twt from "#actTwitter";

export async function twtAction(page, config){    
    // Before 
    req = gen.getRequestFromConfig(config);
    const username = config.profile.customField?.twitter_account?.username;
    await twt.loginTwitter(page, config);

    // Body    
    await twt.gotoPostFromURL(page, req.URL);
    await uploadImage(page, req.imageURL, config.taskPath);
    const newPostURL = await replyOrPostContent(page, req.content, req.URL, username);        
    await deleteImage(page, req.imageURL, config.taskPath);
    
    // After           
    const N8N_ROXANE_URL = 'https://n8n.roxane.one/webhook/459504fa-ac07-4b1f-b335-f8deef0e9718';                               
    const n8nResult = await postResultToN8N(N8N_ROXANE_URL, req.comment_task_id, newPostURL);    
    await postToTaskCenter(username, config.taskId, req.comment_task_id, newPostURL, n8nResult);    
}

async function uploadImage(page, imageURL, taskPath){
    if (imageURL) {
        await gen.saveFileFromURL(imageURL, path.join(taskPath, "attachedImage.jpeg"));
        // --- Select Image from Desktop ---
        console.log(`Attempting to upload image from: ${imagePath}`);
        // Upload file
        console.log("Uploading file...");
        const fileInput = await page.$('input[type="file"]');
        await fileInput.uploadFile(imagePath);
        console.log("File uploaded successfully!");

        // Wait for the image to appear in the composer (optional, but good for stability)
        await page.waitForSelector('div[data-testid="attachments"]', {
            visible: true,
            timeout: 20000,
        });
        console.log("Image preview appeared in composer.");    
    }
}

async function replyOrPostContent(page, content, postURL, username){
  const xpathPostedURL = `//span[text()='${content}']`
  if(await act.checkElement(page, xpathPostedURL )){
    await act.click(page, xpathPostedURL);
    await act.pause(2000);
    const newPostURL = await page.url();
    console.log("New URL is arealdy posted: ", newPostURL);
    return newPostURL;
  }
  if (postURL) {    
    await act.type(page, "//div[@data-testid='tweetTextarea_0']", content);
    await page.keyboard.press('Enter');
    await act.pause(2000);            
    await act.click(page, "//button/div/span/span[text()='Reply']") 
    
  } else {
    await act.type(page, "//div[@data-testid='tweetTextarea_0']", content);
    await page.keyboard.press('Enter');
    await act.pause(2000);            
    await act.click(page, "//button/div/span/span[text()='Post']");        
  }
      
  try{
    const postId = await twt.getNewPostID(page);  
    if(postId){
        const newPostURL = `https://twitter.com/${username}/status/${postId}`;
        return newPostURL;
    }
  }catch(error){
    message = responseBody.errors.message;
    console.log("Post ID not found", message);    
  }        
  return null;
}

async function deleteImage(page,  imageURL, taskPath){      
    await gen.takeScreen(page, path.join(taskPath, "output", "result.png"));  
    if(imageURL){
        await gen.deleteFile(path.join(taskPath, "attachedImage.jpeg"));
    }
}

async function postResultToN8N(N8N_ROXANE_URL, comment_task_id, newPostURL){ 
    if(comment_task_id){            
        if(newPostURL){
          try {
              const postData = {
                  comment_task_id: comment_task_id,
                  url: newPostURL,
              };
      
              return await gen.postToWebhook(N8N_ROXANE_URL, postData);
          } catch (error) {
              console.error("Error posting result:", error);
              return error;
          }
        }else{
            console.log("Post URL not found");
            return null;
        }        
    }
}

async function postToTaskCenter(userName, taskId, comment_task_id, newPostURL, n8nResult){    
    if (process.env.TASK_CENTER_URL) {
        try {
          const apiKey = process.env.TASK_CENTER_API_KEY;
          const userId = process.env.TASK_CENTER_USER_ID;
          if (!apiKey) {
            return;
          }              
          
          let resultDetails = {
            account: userName,
            taskId: taskId,
            comment_task_id: comment_task_id,
            newPostURL: newPostURL,
            postResultToN8N: n8nResult
          }
          const socialAccount = {            
            type: "TWITTER",
            account: userName,
            userId: parseInt(userId),
            taskId: parseInt(taskId),
            scriptId: 10,
            actionType: "REPLY",
            postURL: newPostURL,
            status: n8nResult.success == 'true' ? 'PASS' : 'FAIL',
            result: JSON.stringify(resultDetails),                 
          }
        
          console.log("result", socialAccount.result);
          console.log("socialAccount", socialAccount);
          const updateUrl = `${process.env.TASK_CENTER_URL}/api/social-accounts`;
          console.log("Updating task to center.....", updateUrl)
          const updateResult = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'api-key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(socialAccount),
          });
          if (!updateResult.ok) {
            throw new Error(`Failed to update social account in Task Center: ${updateResult.status}`);
          }
        } catch (error) {
          console.error(`Error happened when update social account in Task Center:`, error);
        }
      }
}

