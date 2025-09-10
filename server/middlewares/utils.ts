import path from "path";
import { LOCAL_PROFILE, TASKS_PROFILE } from "../config";
import { storage } from "../services/storage";
// Changable states

export async function isRunningTask(taskId: number): Promise<boolean> {
    const tasks = await storage.getTasks();
    return tasks.filter((task: any) => task.id === taskId && task.status === 'RUNNING').length > 0;
}

export async function isRunningProfileOfTask(profileId: number): Promise<boolean> {
    const tasks = await storage.getTasks();
    return tasks.filter((task: any) => task.profileId === profileId && task.status === 'RUNNING').length > 0;
}

export async function isRunningProfile(profileId: number): Promise<boolean> {
    const profiles = await storage.getProfiles();
    return profiles.filter((profile: any) => profile.id === profileId && profile.status === 'RUNNING').length > 0;
}

export async function getRunningTaskCount(): Promise<number> {
    const tasks = await storage.getTasks();
    return tasks.filter((task: any) => task.status === 'RUNNING').length;
}

export async function getRunningProfileCount(): Promise<number> {
    const profiles = await storage.getProfiles();
    return profiles.filter((profile: any) => profile.status === 'RUNNING').length;
}

export async function getTaskPathFromTaskId(taskId: number): Promise<string | null> {
    try {
      // Get task from storage directly instead of API call
      const task = await storage.getTask(taskId);
      
      if (!task) {
        console.error(`Task ${taskId} not found`);
        return null;
      }
      
      if ((task.profile as any).dedicatedProfileId) {      
        return path.join(LOCAL_PROFILE, (task.profile as any).dedicatedProfileId.toString(), `task-${taskId}`);
        
      }
      
      if (task.profileId) {
        return path.join(TASKS_PROFILE, task.profileId.toString(), `task-${taskId}`);
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting task path for task ${taskId}:`, error);
      return null;
    }
  }



