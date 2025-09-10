import * as fs from "fs";
import * as path from "path";
import { Task, TaskCenterTask } from "../../shared/schema";
import { storage } from "../services/storage";
import { ExecutionConfig } from "../executions/executionTypes";
import { executeScript } from "../executions/execution";
import * as config from "../config"
import * as utils from "./utils";
import { Profile } from "../../shared/schema";

// Initialize tasks from Task Center at startup
export async function initializeTasks() {
  try {    
    console.log("Initializing tasks from Task Center...");
    await loaddAllTasksFromCenter();        
    setInterval(autoRunTask, (config.INTERVAL_OF_AUTO_RUN_TASK || 60) * 1000);
  } catch (error) {
    console.error("Failed to initialize tasks from Task Center:", error);
  }
}

export async function loaddAllTasksFromCenter() {
  if (process.env.TASK_CENTER_URL) {
    try {
      const apiKey = process.env.TASK_CENTER_API_KEY;
      if (!apiKey) {
        return;
      }
      const updateUrl = `${process.env.TASK_CENTER_URL}/api/users/${process.env.TASK_CENTER_USER_ID}/tasks`;
      const response = await fetch(updateUrl, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.log(`Failed to fetch task from Task Center`);
        return null;
      }

      const taskCenterTasks = await response.json();
      let syncedCount = 0;
      let newCount = 0;
      
      if (taskCenterTasks && taskCenterTasks.length > 0) {
        // Sync loaded tasks with in-memory storage
        for (const task of taskCenterTasks) {
          const existingTask = await storage.getTask(task.id);
          if (!existingTask) {
            // Task exists in Task Center but not in memory, add it to storage
            await storage.createTask(task as any);
            newCount++;
            // console.log(`Added new task ${task.id} from Task Center`);
          } else {
            // Update existing task with latest data from Task Center
            await storage.updateTask(task.id, task as any);
            syncedCount++;
            // console.log(`Updated task ${task.id} from Task Center`);
          }
        }
      }

      const tasks = await storage.getTasks();
      tasks.sort((a: any, b: any) => a.id - b.id);
      console.log("Tasks loaded from Task Center:", tasks.length);
      return tasks;
    } catch (error) {
      console.log(`Failed to fetch task from Task Center`);
      return null;
    }
  }
}

export async function runTaskById(id: number) {          
    try {    
      const task: Task | undefined = await storage.getTask(id);
      
      if(!task){
       
        console.log(`Task ${id} not found`);
        return;
      }
      if(await utils.isRunningTask(id)){
        throw new Error(`Task ${id} is already running`);
      }
      if(task?.profileId && await utils.isRunningProfileOfTask(task?.profileId)){
        console.log(`Profile ${task?.profileId} of Task ${id} is already running`);
        return;
      }
      
      const profileData = task.profile as any;      
      const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;      
      
      // Profile management functionality is now handled directly in profiles.ts      
      let profilePath;
      let profileConfig;
      let scriptContent = '';
  
      try {
        // Check if task has dedicated profile
        if (dedicatedProfileId) {
          const profileId = dedicatedProfileId.toString();
          profilePath = path.join(config.LOCAL_PROFILE, profileId);
          const configPath = path.join(profilePath, 'config.json');
          console.log(`[Task ${id}] Using dedicated profile ${profileId} from ${profilePath}`);
          
          try {
            const dedicatedConfigData = await fs.promises.readFile(profilePath, 'utf8');
            profileConfig = JSON.parse(dedicatedConfigData);
            console.log(`[Task ${id}] Read config.json from dedicated profile`);
          } catch (configError) {
            console.error(`[Task ${id}] Failed to read config from dedicated profile:`, configError);
            // Fallback to default config
            profileConfig = {
              id: id.toString(),
              name: `Task ${id} Profile`,
              description: `Profile for task ${id}`,              
              created: new Date().toISOString(),
              lastModified: new Date().toISOString()
            };
          }
        } else {
          // Use original task profile data logic
          // Create task profile directory
          const profileId = task.profileId?.toString()||"Unknown";        
          profilePath = path.join(config.TASKS_PROFILE, profileId);
          await fs.promises.mkdir(profilePath, { recursive: true });
          console.log(`[Task ${id}] Created temporary profile directory: ${profilePath} (folder: ${profileId})`);
        
          profileConfig = task.profile as any || {};

          try{
            profileConfig.customField = JSON.parse(profileConfig.customField);
          }catch(error){
            // console.log(profileConfig.customField)
            // console.error(`[Task ${id}] Failed to parse customField:`, error);
          }
          const configPath = path.join(profilePath, 'config.json');
          await fs.promises.writeFile(configPath, JSON.stringify(profileConfig, null, 2), 'utf8');
          console.log(`[Task ${id}] Created config.json from task profile data`);
        }
       
        // Create chrome-profile directory for browser session data
        const chromeProfilePath = path.join(profilePath, 'chrome-profile');
        await fs.promises.mkdir(chromeProfilePath, { recursive: true });
        const taskPath = path.join(profilePath, "task-" + id.toString());
        await fs.promises.mkdir(taskPath, { recursive: true });
  
        // Write script file
        const script = task.script as { content?: string } || {};
        scriptContent = script.content || '';
        const scriptPath = path.join(taskPath, 'script.js');
        await fs.promises.writeFile(scriptPath, scriptContent, 'utf8');
        console.log(`[Task ${id}] Created script.js`);
  
        // Write request file
        const request = task.request;
        const requestPath = path.join(taskPath, 'request.json');
        // Handle both string and object formats
        const requestData = typeof request === 'string' ? request : JSON.stringify(request, null, 2);
        await fs.promises.writeFile(requestPath, requestData, 'utf8');
        console.log(`[Task ${id}] Created request.json`);
           
        const executionConfig: ExecutionConfig = {
          type: "task",
          taskId: id,
          taskPath: taskPath,
          task: task,
          profileId: (task.profile as Profile).id,
          profilePath: profilePath,
          profile: task.profile as Profile,
          config: config
        };      

        // Update status as "RUNNING" in Task Center
        await updateTaskCenter(id.toString(), 'RUNNING', null);
        
        // Update task status in local storage
        await storage.updateTask(id, {
          status: "RUNNING",
        });      
                
        const result = await executeScript(executionConfig);
        // console.log(result);
                
        // Update task status in local storage
        await storage.updateTask(id, {
          status: result.status,
          response: result
        });
    
        // Update task in Task Center if URL is configured
        await updateTaskCenter(id.toString(), result.status , result);
       
      } catch (error) {
        console.error(`[Task ${id}] Error during execution:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`[Task ${id}] Error during task execution:`, error);
      throw error;
    }
  
}

export async function updateTaskCenter(id: string, status: string, response: any) {
  
  if (process.env.TASK_CENTER_URL) {
    try {
      const apiKey = process.env.TASK_CENTER_API_KEY;
      const userId = process.env.TASK_CENTER_USER_ID;
      if (!apiKey) {
        return;
      }      
      const updateUrl = `${process.env.TASK_CENTER_URL}/api/users/${userId}/tasks/${id}`;
      console.log("Updating task to center.....", updateUrl)
      const updateResult = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          response: response
        }),
      });
      if (!updateResult.ok) {
        throw new Error(`Failed to update task in Task Center: ${updateResult.status}`);
      }
    } catch (error) {
      console.error(`[Task ${id}] Failed to update Task Center:`, error);
    }
  }
}

async function autoRunTask() {  
  if (config.IS_AUTO_RUN_TASK != true) {return}
  console.log("start auto run...");
  try {      
    if (await utils.getRunningTaskCount() >= config.PARRALEL_RUNNING_TASK) {
      console.log("Auto run is disabled because there are running scripts");
      return;
    }
    const tasks = await loaddAllTasksFromCenter();   
    if(!tasks){
      console.log("No tasks found");
      return;
    }   
    
    const task = await getTaskToRun(tasks);   
    if(!task){
      console.log("No task could be executed");
      return;
    }else{
      try {                    
        await runTaskById(task.id);
      } catch (error) {
        console.error(`Failed to auto-run task ${task.id}:`, error);
      }
    }     
  
  } catch (error) {
    console.error('Auto-run error:', error);
  }
};

async function getTaskToRun(tasks: any){
  let task = null;
  for (const centerTask of tasks ) {
    if (centerTask.status === 'READY') {
      if(centerTask?.profileId && await utils.isRunningProfileOfTask(centerTask?.profileId)){
        console.log(`Profile ${centerTask?.profileId} of Task ${centerTask.id} is already running`);
        continue;
      }else{
        task = centerTask;      
        return task;
      }      
    }
  }
  return task;
}
