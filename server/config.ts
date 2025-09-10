import * as path from 'path';

// For Task Execution
export let IS_AUTO_RUN_TASK = false;
export let INTERVAL_OF_AUTO_RUN_TASK = 15;
export let PARRALEL_RUNNING_TASK = 1;
// export let START_RETRY_ID = 380;

// For Profile Execution
export let IS_AUTO_RUN_PROFILE = false;
export let INTERVAL_OF_AUTO_RUN_PROFILE = 15;
export let PARRALEL_RUNNING_PROFILE = 1;
export let IS_TWITTER_CARRING = false;

// For Script Runner
export const ORIGINAL_CWD = process.cwd();
export const LOCAL_PROFILE = path.join(ORIGINAL_CWD, 'storage', 'local');
export const TASKS_PROFILE = path.join(ORIGINAL_CWD, 'storage', 'tasks');
export const PATH_OF_CHROME_WIN32="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
export const PATH_OF_CHROME_OTHER="/usr/bin/chromium-browser";
export let BROWSER_TYPE: "puppeteer" | "playwright" = "puppeteer";

export function innitializeConfig(){
  console.log('Initializing config...');
  
  IS_AUTO_RUN_TASK = Boolean(process.env.IS_AUTO_RUN_TASK);
  
  const intervalTask = parseInt(process.env.INTERVAL_OF_AUTO_RUN_TASK || '');
  INTERVAL_OF_AUTO_RUN_TASK = (!isNaN(intervalTask) && intervalTask > 0) ? intervalTask : 15;
  
  const parallelTask = parseInt(process.env.PARRALEL_RUNNING_TASK || '');
  PARRALEL_RUNNING_TASK = (!isNaN(parallelTask) && parallelTask > 0) ? parallelTask : 1;

  IS_AUTO_RUN_PROFILE = Boolean(process.env.IS_AUTO_RUN_PROFILE);
  
  const intervalProfile = parseInt(process.env.INTERVAL_OF_AUTO_RUN_PROFILE || '');
  INTERVAL_OF_AUTO_RUN_PROFILE = (!isNaN(intervalProfile) && intervalProfile > 0) ? intervalProfile : 15;
  
  const parallelProfile = parseInt(process.env.PARRALEL_RUNNING_PROFILE || '');
  PARRALEL_RUNNING_PROFILE = (!isNaN(parallelProfile) && parallelProfile > 0) ? parallelProfile : 1;

  IS_TWITTER_CARRING = Boolean(process.env.IS_TWITTER_CARRING);

  console.log('Config initialized:', {
    IS_AUTO_RUN_TASK,
    INTERVAL_OF_AUTO_RUN_TASK,
    PARRALEL_RUNNING_TASK,
    IS_AUTO_RUN_PROFILE,
    INTERVAL_OF_AUTO_RUN_PROFILE,
    PARRALEL_RUNNING_PROFILE,
    IS_TWITTER_CARRING
  });
}

// Setter functions for updating configuration values
export function updateTaskSettings(settings: {
  isAutoRunTask?: boolean;
  intervalOfAutoRunTask?: number;
  parallelRunningTask?: number;
}) {
  if (typeof settings.isAutoRunTask === 'boolean') {
    IS_AUTO_RUN_TASK = settings.isAutoRunTask;
  }
  if (typeof settings.intervalOfAutoRunTask === 'number' && settings.intervalOfAutoRunTask > 0) {
    INTERVAL_OF_AUTO_RUN_TASK = settings.intervalOfAutoRunTask;
  }
  if (typeof settings.parallelRunningTask === 'number' && settings.parallelRunningTask > 0) {
    PARRALEL_RUNNING_TASK = settings.parallelRunningTask;
  }
}

export function updateProfileSettings(settings: {
  isAutoRunProfile?: boolean;
  intervalOfAutoRunProfile?: number;
  parallelRunningProfile?: number;
  isTwitterCarring?: boolean;
}) {
  if (typeof settings.isAutoRunProfile === 'boolean') {
    IS_AUTO_RUN_PROFILE = settings.isAutoRunProfile;
  }
  if (typeof settings.intervalOfAutoRunProfile === 'number' && settings.intervalOfAutoRunProfile > 0) {
    INTERVAL_OF_AUTO_RUN_PROFILE = settings.intervalOfAutoRunProfile;
  }
  if (typeof settings.parallelRunningProfile === 'number' && settings.parallelRunningProfile > 0) {
    PARRALEL_RUNNING_PROFILE = settings.parallelRunningProfile;
  }
  if (typeof settings.isTwitterCarring === 'boolean') {
    IS_TWITTER_CARRING = settings.isTwitterCarring;
  }
} 
