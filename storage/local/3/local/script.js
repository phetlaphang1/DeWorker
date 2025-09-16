// HTTP Request to http://toikhoe.com.vn/api/posts
  const httpResponse = await (async () => {
    const axios = (await import('axios')).default;
    const requestConfig = {
      method: "GET",
      url: "http://toikhoe.com.vn/api/posts",
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    try {
      console.log('Making HTTP GET request to:', 'http://toikhoe.com.vn/api/posts');
      const response = await axios(requestConfig);
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('HTTP Request failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  })();
  console.log('Response stored in variable: httpResponse');
  console.log("httpResponse:", httpResponse);
