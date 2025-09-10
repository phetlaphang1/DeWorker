import axios from "axios";
import dotenv from "dotenv";    
import * as act  from "#act";
dotenv.config();


const apiUrl="https://llmapi.roxane.one/v1/chat/completions";
const apiKey="wilson-1750681308487-cloudworker";


async function promptBase() {   
    const data = {
        model: "text-model",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Make a comment for this post." },
        ],
    };

    await axios
        .post(apiUrl, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        })
        .then((response) => {
            // console.log(response);
            console.log("Response:", response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        })
        .catch((error) => {
            console.error("Error:", error.response ? error.response.data : error.message);
        });
}

async function promptByContent(content) {    
    const data = {
        model: "text-model",
        messages: [
            {
                role: "system",
                // content: "You get a tweet and return a comment. Remmember a comment only",
                content: "You get a tweet and return a comment",
            },
            { role: "user", content: content },
        ],
    };

    const comment = await axios
        .post(apiUrl, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        })
        .then((response) => {
            // console.log("Response:", response);
            // console.log("Response:", response.data.choices);
            // console.log("Response:", response.data.choices[0].message);
            // console.log("Response:", response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        })
        .catch((error) => {
            console.error("Error:", error.response ? error.response.data : error.message);
        });
    return comment;
}

async function getCommentByAI(post) {
    const data = {
        "result": {
            "status": "",
            "comment": "",
            "reasoning": ""                
        }    
    }
    let prompt = "Check this post as below then return a comment without any explaination: \n";
    prompt += post;
    prompt += "\n\nReturn a JSON object as below with status as FAILED if you can not generate a comment: \n";
    prompt += JSON.stringify(data);

    console.log("User prompt: " + prompt);
    console.log("Waiting Roxane AI repsonse...");    
    let res;
    for(let i = 0; i < 3; i++){
        const rawRes = await promptByContent(prompt);
        res = JSON.parse(extractJsonString(rawRes));
        console.log(res.result);
        if(res.result.status == "SUCCESS"){            
            return res;            
        }        
        await act.pause(2000);
        
    }           
    return res;   
}

function extractJsonString(input) {
    // Find the starting index of the first '{'
    const startIndex = input.indexOf('{');
  
    // Find the ending index of the last '}'
    const endIndex = input.lastIndexOf('}');
  
    // If either character is not found, return null or an empty string
    if (startIndex === -1 || endIndex === -1) {
      return null;
    }
  
    // Use slice() to get the substring from the first '{' to the last '}' (inclusive)
    return input.slice(startIndex, endIndex + 1);
}

export { promptBase, promptByContent, getCommentByAI };
