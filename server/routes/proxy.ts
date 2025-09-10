import { Request, Response } from "express";
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

export function registerProxyRoutes(app: any) {
  app.post('/api/proxy-test', async (req: Request, res: Response) => {
    try {
      const {
        proxyType,
        proxyHost,
        proxyPort,
        proxyUsername,
        proxyPassword,
        testUrl = 'https://ifconfig.me/ip'
      } = req.body;

      // Validate required fields
      if (!proxyHost || !proxyPort) {
        return res.status(400).json({ 
          error: 'Proxy host and port are required' 
        });
      }

      // Construct proxy URL
      const proxyUrl = `${proxyType}://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;
      
      // Create proxy agent
      const agent = new HttpsProxyAgent(proxyUrl);

      // Make test request
      const response = await axios.get(testUrl, {
        httpsAgent: agent,
        httpAgent: agent,
        timeout: 10000
      });

      res.json({
        success: true,
        ip: response.data.trim()
      });

    } catch (error: any) {
      console.error('Proxy test failed:', error);
      
      let message = 'Proxy test failed';
      let status = 500;
      
      if (error.code === 'ECONNABORTED') {
        message = 'Proxy connection timed out';
        status = 408;
      } else if (error.code === 'ERR_PROXY_AUTHENTICATION_REQUIRED') {
        message = 'Invalid proxy credentials';
        status = 401;
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Proxy connection refused';
        status = 503;
      }

      res.status(status).json({
        success: false,
        message
      });
    }
  });
}
