import type { Express } from "express";
import { killAllChromeProcesses } from "../executions/execution";
import { getRunningProfileCount, getRunningTaskCount } from '../middlewares/utils';
import { 
  IS_AUTO_RUN_TASK,
  INTERVAL_OF_AUTO_RUN_TASK,
  PARRALEL_RUNNING_TASK,
  IS_AUTO_RUN_PROFILE,
  INTERVAL_OF_AUTO_RUN_PROFILE,
  PARRALEL_RUNNING_PROFILE,
  IS_TWITTER_CARRING,
  updateTaskSettings,
  updateProfileSettings
} from '../config';

export function registerSettingsRoutes(app: Express): void {
  // Get all settings
  app.get('/api/settings', async (req, res) => {
    try {
      let executionStatus = {
        runningTasks: 0,
        runningProfiles: 0
      };
      
      // Try to get execution status, but don't fail if it errors
      try {
        const runningTasks = await getRunningTaskCount();
        const runningProfiles = await getRunningProfileCount();     
        executionStatus = { 
          runningTasks,
          runningProfiles
        };
      } catch (error) {
        console.error('Error getting execution status:', error);
        // Continue with default values
      }
      
      // Dynamically require config to get current values
      
      res.json({
        executionStatus,
        taskSettings: {
          isAutoRunTask: IS_AUTO_RUN_TASK,
          intervalOfAutoRunTask: INTERVAL_OF_AUTO_RUN_TASK,
          parallelRunningTask: PARRALEL_RUNNING_TASK
        },
        profileSettings: {
          isAutoRunProfile: IS_AUTO_RUN_PROFILE,
          intervalOfAutoRunProfile: INTERVAL_OF_AUTO_RUN_PROFILE,
          parallelRunningProfile: PARRALEL_RUNNING_PROFILE,
          isTwitterCarring: IS_TWITTER_CARRING
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        error: 'Failed to fetch settings'
      });
    }
  });

  // Update task settings
  app.post('/api/settings/tasks', async (req, res) => {
    try {
      const { isAutoRunTask, intervalOfAutoRunTask, parallelRunningTask } = req.body;
      
      // Update config values using setter function
      updateTaskSettings({
        isAutoRunTask,
        intervalOfAutoRunTask,
        parallelRunningTask
      });
      
      res.json({
        success: true,
        settings: {
          isAutoRunTask: IS_AUTO_RUN_TASK,
          intervalOfAutoRunTask: INTERVAL_OF_AUTO_RUN_TASK,
          parallelRunningTask: PARRALEL_RUNNING_TASK
        }
      });
    } catch (error) {
      console.error('Error updating task settings:', error);
      res.status(500).json({
        error: 'Failed to update task settings'
      });
    }
  });

  // Update profile settings
  app.post('/api/settings/profiles', async (req, res) => {
    try {
      const { isAutoRunProfile, intervalOfAutoRunProfile, parallelRunningProfile, isTwitterCarring } = req.body;

      // Update config values using setter function
      updateProfileSettings({
        isAutoRunProfile,
        intervalOfAutoRunProfile,
        parallelRunningProfile,
        isTwitterCarring,
      });
      
      res.json({
        success: true,
        settings: {
          isAutoRunProfile: IS_AUTO_RUN_PROFILE,
          intervalOfAutoRunProfile: INTERVAL_OF_AUTO_RUN_PROFILE,
          parallelRunningProfile: PARRALEL_RUNNING_PROFILE,
          isTwitterCarring: IS_TWITTER_CARRING,
        }
      });
    } catch (error) {
      console.error('Error updating profile settings:', error);
      res.status(500).json({
        error: 'Failed to update profile settings'
      });
    }
  });

  // Add Chrome process termination endpoint
  app.post("/api/settings/terminate-chrome", async (req, res) => {
    try {
      
      const result = await killAllChromeProcesses();
      res.json(result);
    } catch (error: any) {
      console.error("Error terminating Chrome processes:", error);
      res.status(500).json({ 
        error: "Failed to terminate Chrome processes",
        details: error.message 
      });
    }
  });  
}


