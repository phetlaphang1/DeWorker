import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertTriangle, Settings, ListTodo, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsPanelProps {
  autoFetchInterval: number;
  isAutoFetchEnabled: boolean;
  onAutoFetchChange: (interval: number, enabled: boolean) => void;
}

interface TaskSettings {
  isAutoRunTask: boolean;
  intervalOfAutoRunTask: number;
  parallelRunningTask: number;
}

interface ProfileSettings {
  isAutoRunProfile: boolean;
  intervalOfAutoRunProfile: number;
  parallelRunningProfile: number;
  isTwitterCarring: boolean;
}

export default function SettingsPanel({
  autoFetchInterval,
  isAutoFetchEnabled,
  onAutoFetchChange
}: SettingsPanelProps) {
  const [isTerminatingChrome, setIsTerminatingChrome] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [executionStatus, setExecutionStatus] = useState({
    runningTasks: 0,
    runningProfiles: 0
  }); 
  
  const [taskSettings, setTaskSettings] = useState<TaskSettings>({
    isAutoRunTask: true,
    intervalOfAutoRunTask: 15,
    parallelRunningTask: 1
  });
  
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    isAutoRunProfile: true,
    intervalOfAutoRunProfile: 15,
    parallelRunningProfile: 5,
    isTwitterCarring: true
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {        
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.executionStatus) {
          setExecutionStatus(data.executionStatus);
        }
        if (data.taskSettings) {
          setTaskSettings(data.taskSettings);
        }
        if (data.profileSettings) {
          setProfileSettings(data.profileSettings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleTerminateChrome = async () => {
    setShowConfirmDialog(false);
    setIsTerminatingChrome(true);
    try {
      const response = await fetch('/api/settings/terminate-chrome', { method: 'POST' });
      const result = await response.json();
      toast({
        title: result.killed > 0 ? "Success" : "Info",
        description: result.message || 
          (result.killed > 0 
            ? `${result.killed} Chrome process(es) terminated` 
            : "No Chrome processes found"),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate Chrome processes",
        variant: "destructive",
      });
    } finally {
      setIsTerminatingChrome(false);
    }
  };
  
  const handleSaveTaskSettings = async () => {
    try {
      const response = await fetch('/api/settings/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskSettings)
      });
      
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Task settings have been updated successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save task settings",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveProfileSettings = async () => {
    try {
      const response = await fetch('/api/settings/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileSettings)
      });
      
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Profile settings have been updated successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="profiles" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Profiles
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-4">
        <Card>          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <div>
                  <h4 className="font-medium">Execution Status</h4>
                  <p className="text-muted-foreground">
                    {executionStatus.runningTasks} running task(s), {executionStatus.runningProfiles} running profile(s)
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">                        
                <Button 
                  variant="destructive" 
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isTerminatingChrome}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {isTerminatingChrome ? "Terminating..." : "Terminate"}
                </Button>
                <div>
                    <h4 className="font-medium">Terminate Chrome Processes</h4>
                    <p className="text-sm text-muted-foreground">
                      Force close all running Chrome instances
                    </p>            
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="tasks" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Task Execution Settings
            </CardTitle>
            <CardDescription>
              Configure automatic task execution parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-run-task"
                  checked={taskSettings.isAutoRunTask}
                  onCheckedChange={(checked) => 
                    setTaskSettings({...taskSettings, isAutoRunTask: checked === true})
                  }
                />
                <Label htmlFor="auto-run-task" className="font-medium">
                  Enable Auto Run Task                  
                </Label>
                <p className="text-sm text-muted-foreground">IS_AUTO_RUN_TASK</p>
              </div>
              
              <div className="flex items-center space-x-2">                
                <Input
                  id="task-interval"
                  type="number"
                  min="1"
                  value={taskSettings.intervalOfAutoRunTask}
                  onChange={(e) => 
                    setTaskSettings({...taskSettings, intervalOfAutoRunTask: parseInt(e.target.value) || 15})
                  }
                  className="w-32"
                />
                <Label htmlFor="task-interval">Auto Run Interval (seconds)</Label>
                <p className="text-sm text-muted-foreground">INTERVAL_OF_AUTO_RUN_TASK</p>
              </div>
              
              <div className="flex items-center space-x-2">                  
                <Input
                  id="task-parallel"
                  type="number"
                  min="1"
                  max="10"
                  value={taskSettings.parallelRunningTask}
                  onChange={(e) => 
                    setTaskSettings({...taskSettings, parallelRunningTask: parseInt(e.target.value) || 1})
                  }
                  className="w-32"
                />
                <Label htmlFor="task-parallel">Parallel Running Tasks</Label>
                <p className="text-sm text-muted-foreground">PARRALEL_RUNNING_TASK</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={handleSaveTaskSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Task Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="profiles" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Profile Execution Settings
            </CardTitle>
            <CardDescription>
              Configure automatic profile execution parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-twitter-profile"
                  checked={profileSettings.isAutoRunProfile}
                  onCheckedChange={(checked) => 
                    setProfileSettings({...profileSettings, isAutoRunProfile: checked === true})
                  }
                />
                <Label htmlFor="auto-twitter-profile" className="font-medium">
                  Enable Auto RUN Profile
                </Label>
                <p className="text-sm text-muted-foreground">IS_AUTO_RUN_PROFILE</p>
              </div>
              
              <div className="flex items-center space-x-2">                
                <Input
                  id="profile-interval"
                  type="number"
                  min="1"
                  value={profileSettings.intervalOfAutoRunProfile}
                  onChange={(e) => 
                    setProfileSettings({...profileSettings, intervalOfAutoRunProfile: parseInt(e.target.value) || 15})
                  }
                  className="w-32"
                />
                <Label htmlFor="profile-interval">Auto Run Interval (seconds)</Label>
                <p className="text-sm text-muted-foreground">INTERVAL_OF_AUTO_RUN_PROFILE</p>                
              </div>
              
              <div className="flex items-center space-x-2">                
                <Input
                  id="profile-parallel"
                  type="number"
                  min="1"
                  max="20"
                  value={profileSettings.parallelRunningProfile}
                  onChange={(e) => 
                    setProfileSettings({...profileSettings, parallelRunningProfile: parseInt(e.target.value) || 5})
                  }
                  className="w-32"
                />
                <Label htmlFor="profile-parallel">Parallel Running Profiles</Label>
                <p className="text-sm text-muted-foreground">PARRALEL_RUNNING_PROFILE</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="twitter-carring"
                  checked={profileSettings.isTwitterCarring}
                  onCheckedChange={(checked) => 
                    setProfileSettings({...profileSettings, isTwitterCarring: checked === true})
                  }
                />
                <Label htmlFor="twitter-carring" className="font-medium">
                  Enable Twitter Carring
                </Label>
                <p className="text-sm text-muted-foreground">IS_TWITTER_CARRING</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={handleSaveProfileSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Profile Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Chrome Termination</AlertDialogTitle>
            <AlertDialogDescription>
              This will forcefully terminate all Chrome processes. Any unsaved work in Chrome may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTerminateChrome}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate Chrome
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}