import puppeteer from "puppeteer";
import * as act from "#act";
await page.goto("https://tinhte.vn/");
  console.log("Page title:", await page.title());
  await act.click(page, "//*[@id=\"__next\"]/div[1]/div[1]/div[2]/div/div/div[1]/div[1]/ol/li[1]/div[2]/article/div/h4/a", 0);
  // Extract text content from element
  const extractedData = await act.getText(page, "//*[@id=\"__next\"]/div[1]/div/div[2]/div[2]/div[1]/div/div/div[1]/main/article/div/div/div[1]/div[1]/span[1]");
  console.log("Extracted text into 'extractedData':", extractedData);
  // Assign variable from extractedData to processedData
  const processedData = extractedData;
  console.log("Assigned 'processedData':", processedData);
  for (let i = 0; i < 2; i++) {
    console.log("Loop iteration:", i + 1);
  // AI Assistant (assistant) - Using Roxane API
  const aiResponse = await (async () => {
    const axios = (await import('axios')).default;
  
    const requestConfig = {
      method: 'POST',
      url: 'https://llmapi.roxane.one/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer linh-1752464641053-phonefarm'
      },
      data: {
        model: 'text-model',
        messages: [
          { role: 'system', content: "You are a helpful assistant. Answer directly and concisely. No explanations or formatting unless asked." },
          { role: 'user', content: "viết 5 lần câu xin chào " }
        ],
        temperature: 0.8,
        max_tokens: 150
      }
    };
  
    try {
      console.log('Calling Roxane AI (assistant mode)...');
      const response = await axios(requestConfig);
      let aiText = response.data.choices[0].message.content;
      
      // Clean the response
      aiText = aiText.trim();
      // Remove quotes if present
      aiText = aiText.replace(/^["']|["']$/g, '');
      // Remove common prefixes
      aiText = aiText.replace(/^(Comment:|Answer:|Response:|Here is|Here's)\s*/i, '');
      // Remove markdown formatting
      aiText = aiText.replace(/\*\*(.*?)\*\*/g, '$1');
      aiText = aiText.replace(/__(.*?)__/g, '$1');
      aiText = aiText.replace(/\*(.*?)\*/g, '$1');
      aiText = aiText.replace(/_(.*?)_/g, '$1');
      
      console.log('AI Response:', aiText);
      return aiText;
    } catch (error) {
      console.error('Roxane AI Request failed:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      throw error;
    }
  })();
  console.log('AI response stored in: aiResponse');
  console.log("aiResponse:", aiResponse);
  }
