import {
  Search,
  RefreshCw,
  Clock,
  User,
  Server,
  Edit,
  Play,
  Trash2,
  CheckSquare,
  FileText,
  Eye,
  EyeOff,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  File,
  Download,
  UserPlus,
  Check,
  Square,
  Activity,
  Copy,
  ExternalLink,
  Users,
  ChevronUp,
  ChevronDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Chrome,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/libs/api";
import { apiRequest } from "@/libs/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import TaskDetailsModal from "./taskDetails";
import ProfileDetailsModal from "./profileDetails";
import ScriptDetailsModal from "./scriptDetails";
import {LogDetailsModal, OutputDetailsModal } from "./lib/actionsColumn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, TaskCenterTask } from "@shared/schema";
import { ProfileAssignment } from './profileAssignment';
import {
  getStatusBadgeVariant,
  getStatusBadgeClasses,
  mapLegacyStatus
} from './lib/executionStatus';

interface TasksPanelProps {
  tasks: Task[];
  isLoading: boolean;
  onFetchTasks: () => void;
  isFetching: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function TasksPanel({
  tasks,
  isLoading,
  onFetchTasks,
  isFetching,
  onRefresh,
  isRefreshing = false,
}: TasksPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'profile' | 'script' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [profileFilter, setProfileFilter] = useState("all");
  const [scriptFilter, setScriptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [scriptDetailsOpen, setScriptDetailsOpen] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState<any>(null);
  const [selectedScriptData, setSelectedScriptData] = useState<any>(null);
  const [logDetails, setLogDetails] = useState<{
    taskId: number;
    content: string;
  } | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [outputDetails, setOutputDetails] = useState<{
    taskId: number;
    files: any[];
    path: string;
  } | null>(null);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  // Profile selection modal states
  const [isProfileSelectionOpen, setIsProfileSelectionOpen] = useState(false);
  const [taskForProfileSelection, setTaskForProfileSelection] = useState<Task | null>(null);
  // Clear confirmation modal states
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [taskToBeCleared, setTaskToBeCleared] = useState<Task | null>(null);
  
  // Task running state management - allow multiple tasks to run simultaneously
  const [runningTaskIds, setRunningTaskIds] = useState<Set<number>>(new Set());
  
  

  // Real-time log viewer states
  const [isRealtimeLogOpen, setIsRealtimeLogOpen] = useState(false);
  const [realtimeLogTask, setRealtimeLogTask] = useState<Task | null>(null);

  // Fetch profiles for selection - cached for longer since they change less frequently
  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: () => fetch("/api/profiles").then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Always enable all View/Show buttons
  const taskLogStatus = {
    [Symbol.iterator]: () => ({ next: () => ({ done: true, value: true }) }),
  };
  const taskOutputStatus = {
    [Symbol.iterator]: () => ({ next: () => ({ done: true, value: true }) }),
  };

  // Click handlers for detailed views
  const handleTaskIdClick = async (task: Task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleProfileClick = async (task: Task) => {
    const profileData = task.profile as TaskCenterTask['profile'] | null;
    const isDedicated = profileData?.isDedicated ?? false;
    const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;
    // If task has a dedicated profile, show profile details    
    if (dedicatedProfileId) {
      try {
        const response = await fetch(`/api/profiles/${dedicatedProfileId}`);
        if (response.ok) {
          const profile = await response.json();
          setSelectedProfileData(profile);
          setProfileDetailsOpen(true);
        } else {
          toast({
            title: "Profile Not Found",
            description: "The assigned profile could not be loaded",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      }
    } else if (!isDedicated) {
      // Load original profile data from API
      setSelectedProfileData(task.profile);
      setProfileDetailsOpen(true);
    } else {
      // Open profile selection modal
      setTaskForProfileSelection(task);
      setIsProfileSelectionOpen(true);
    }
  };

  const handleClearClick = (task: Task) => {
    setTaskToBeCleared(task);
    setIsClearConfirmOpen(true);
  };

  const confirmClear = () => {
    if (taskToBeCleared) {
      clearTaskMutation.mutate(taskToBeCleared.id);
    }
  };

  const getDedicatedProfileName = (task: Task) => {
    const profileData = task.profile as TaskCenterTask['profile'] | null;
    const dedicatedProfileId = profileData?.dedicatedProfileId ?? null;
    if (dedicatedProfileId) {
      const profile = profiles.find((p: any) => p.id === dedicatedProfileId);
      return profile ? profile.name : `Profile ${dedicatedProfileId}`;
    }
    return null;
  };

  const handleScriptClick = async (task: Task) => {
    // Load script data from the task's script element stored in scriptData
    if ((task as any).script) {
      setSelectedScriptData((task as any).script);
      setScriptDetailsOpen(true);
    } else {
      toast({
        title: "No Script Data",
        description: "This task does not have associated script information",
        variant: "destructive",
      });
    }
  };

  const handleTaskLogClick = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/log`);
      if (response.ok) {
        const data = await response.json();
        setLogDetails({ taskId: task.id, content: data.content });
        setIsLogModalOpen(true);
      } else {
        toast({
          title: "No Log Found",
          description:
            "No log file exists for this task yet. Run the task first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch log content",
        variant: "destructive",
      });
    }
  };

  const handleTaskOutputClick = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/output`);
      if (response.ok) {
        const data = await response.json();
        setOutputDetails({ taskId: task.id, ...data });
        setIsOutputModalOpen(true);
      } else {
        toast({
          title: "No Output Found",
          description:
            "No output folder exists for this task yet. Run the task first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load output files",
        variant: "destructive",
      });
    }
  };

  const handleTaskLiveLogsClick = (task: Task) => {
    setRealtimeLogTask(task);
    setIsRealtimeLogOpen(true);
  };

  // Mutation to clear task
  const clearTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // First clear the task folder
      await fetch(`/api/tasks/${taskId}/clear`, { method: 'POST' });
      // Then delete the task
      return api.tasks.delete(taskId);
    },
    onSuccess: (_, taskId) => {
      // Optimistically remove the task from cache instead of full refetch
      queryClient.setQueryData(["/api/tasks"], (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(task => task.id !== taskId);
      });
      toast({
        title: "Task Cleared",
        description: "Task and all associated data have been cleared successfully",
      });
      setIsClearConfirmOpen(false);
      setTaskToBeCleared(null);
    },
    onError: (error: any) => {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear task",
        variant: "destructive",
      });
      setIsClearConfirmOpen(false);
      setTaskToBeCleared(null);
    },
  });

  // Duplicate task to profile mutation
  const duplicateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      // Create a profile from task data with name "Task [id] - copy"
      const profile = task.profile as TaskCenterTask['profile'] | null;
      let profileData: any = profile;
      profileData.id = null;
      profileData.name = `Task ${task.id} - copy`;
    
      // Create the profile
      const newProfile = await api.profiles.create(profileData);
      
      // If task has script data, copy it to the new profile
      if ((task as any).script && (task as any).script.content) {
        const scriptContent = (task as any).script.content;
        await fetch(`/api/profiles/${(newProfile as any).id}/script`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: scriptContent }),
        });
      }
      console.log("New Profile: ", newProfile);
      return newProfile;
    },
    onSuccess: () => {
      // Only invalidate profiles cache if needed
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Task Duplicated",
        description: "Task has been duplicated as a new profile successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Duplication Failed",
        description: error.message || "Failed to duplicate task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      api.tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Task execution mutation
  const runTaskMutation = useMutation({
    mutationFn: async (params: { taskId: number}): Promise<{ execution?: { status: string; message?: string; duration?: number; browserType?: string }; message?: string }> => {
      setRunningTaskIds(prev => new Set([...Array.from(prev), params.taskId]));
      
      // Immediately update task status to RUNNING
      queryClient.setQueryData(["/api/tasks"], (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(task => 
          task.id === params.taskId 
            ? { ...task, status: "RUNNING" } 
            : task
        );
      });
    
      try {
        console.log("Start Running: ");
        // const response = await api.tasks.run(params);
        const response = await fetch(
          `/api/tasks/${params.taskId}/run`,
          { method: "POST" }
        );
      
        
        console.log("Complete Running: ");
        const result =  (response as any)?.data ?? response;
        console.log("Task Execution Response: ", result);
        return result;
      } catch (error) {
        console.log("Task Execution Error: ", error);
        return {
          execution: {
            status: "error",
            message: error instanceof Error ? error.message : "Task execution failed"
          }
        };
      }
    },
    onSuccess: (data, params) => { 
      const execution = data?.execution;
      console.log("Task execution: ",execution); 

      if (execution) {
        if (execution.status === "error") {
          toast({
            title: "Task Execution Failed",
            description: execution.message || "Script execution failed",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Task Executed Successfully",
            description: `Script completed in ${execution.duration}ms using ${execution.browserType} browser`,
          });
        }
      } else {
        toast({
          title: `Task [${params.taskId}] Executed Completely`,
          description: data?.message || "Task execution finished",
        });
      }
      setRunningTaskIds(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(params.taskId);
        return newSet;
      });
      // Refresh tasks to update status
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: any, params) => {
      console.error("Task execution error:", error);
      toast({
        title: "Task Execution Failed",
        description: error.message || "Failed to execute task",
        variant: "destructive",
      });
      setRunningTaskIds(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(params.taskId);
        return newSet;
      });
      // Refresh tasks to update status after error
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Stop task execution
  const stopTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/stop`);
      return response.json();
    },
    onSuccess: (_, taskId) => {
      setRunningTaskIds(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(taskId);
        return newSet;
      });
      // Refresh tasks to update status after stop
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Stopped",
        description: "Task execution and Chrome processes terminated",
      });
    },
    onError: (error) => {
      console.error("Error stopping task:", error);
      toast({
        title: "Error",
        description: "Failed to stop task execution",
        variant: "destructive",
      });
    },
  });

  const stopTaskExecution = (taskId: number) => {
    stopTaskMutation.mutate(taskId);
  };

  // Browser management functions
  const openBrowserMutation = useMutation({
    mutationFn: async (task: Task) => {
      const profileData = task.profile as TaskCenterTask['profile'] | null;
      const dedicatedProfileId = profileData?.dedicatedProfileId;
      
      if (dedicatedProfileId) {
        // Use dedicated profile
        const response = await fetch(`/api/profiles/${dedicatedProfileId}/open-browser`, {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error('Failed to open browser with dedicated profile');
        }
        return { taskId: task.id, profileId: dedicatedProfileId };
      } else {
        // Use task profile data
        const response = await fetch(`/api/tasks/${task.id}/open-browser`, {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error('Failed to open browser with task profile');
        }
        return { taskId: task.id };
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Browser Opened",
        description: "Chrome browser opened with profile configuration",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Open Browser",
        description: error.message || "Could not open Chrome browser",
        variant: "destructive",
      });
    },
  });

  const getPriorityBadgeVariant = (priority: string) => {
    if (!priority) return "outline";
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Never";
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - then.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Less than 1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  // Enhanced search function to search all task information
  const searchAllTaskInfo = (task: Task, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Basic task info
    const basicInfo = [
      task.name,
      task.id.toString(),
      task.status,
      task.description || ''
    ];
    
    // Profile information
    const profileInfo = [
      getDedicatedProfileName(task) || '',
      (task.profile as any)?.name || '',
      (task.profile as any)?.description || '',
      (task.profile as any)?.browser || '',
      (task.profile as any)?.userAgent || '',
      (task.profile as any)?.proxyHost || '',
      (task.profile as any)?.timezone || '',
      (task.profile as any)?.language || ''
    ];
    
    // Script information
    const scriptInfo = [
      (task as any).script?.name || '',
      (task as any).script?.description || '',
      (task as any).script?.content || ''
    ];
    
    // Request information - directly from task object (stored as JSON)
    const requestInfo: string[] = [];
    try {
      const taskRequest = task.request;
      if (taskRequest) {
        // If it's already an object, stringify it; if it's a string, use directly
        const requestStr = typeof taskRequest === 'string' ? taskRequest : JSON.stringify(taskRequest);
        requestInfo.push(requestStr);
        
        // Try to parse and extract specific fields if it's an object
        if (typeof taskRequest === 'object') {
          const req = taskRequest as any;
          requestInfo.push(req.url || '');
          requestInfo.push(req.method || '');
          requestInfo.push(req.headers ? JSON.stringify(req.headers) : '');
          requestInfo.push(req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : '');
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    // Response information - directly from task object (stored as JSON)  
    const responseInfo: string[] = [];
    try {
      const taskResponse = task.response;
      if (taskResponse) {
        // If it's already an object, stringify it; if it's a string, use directly
        const responseStr = typeof taskResponse === 'string' ? taskResponse : JSON.stringify(taskResponse);
        responseInfo.push(responseStr);
        
        // Try to parse and extract specific fields if it's an object
        if (typeof taskResponse === 'object') {
          const res = taskResponse as any;
          responseInfo.push(res.status?.toString() || '');
          responseInfo.push(res.headers ? JSON.stringify(res.headers) : '');
          responseInfo.push(res.body ? (typeof res.body === 'string' ? res.body : JSON.stringify(res.body)) : '');
          responseInfo.push(res.error || '');
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    // Execution details (may be in various places)
    const executionInfo = [
      (task as any).execution?.browserType || '',
      (task as any).execution?.message || '',
      (task as any).execution?.error || '',
      (task as any).execution?.details || ''
    ];
    
    // Combine all searchable text
    const allSearchableText = [
      ...basicInfo,
      ...profileInfo,
      ...scriptInfo,
      ...requestInfo,
      ...responseInfo,
      ...executionInfo
    ].join(' ').toLowerCase();
    
    // Debug logging (remove this after testing)
    if (searchTerm === "researching it now") {
      console.log('Search debug for task:', task.id);
      console.log('Request data:', task.request);
      console.log('Response data:', task.response);
      console.log('All searchable text:', allSearchableText);
      console.log('Contains search term:', allSearchableText.includes(searchLower));
    }
    
    return allSearchableText.includes(searchLower);
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = searchAllTaskInfo(task, searchTerm);
      const matchesProfile = !profileFilter || profileFilter === "all" || 
                            (getDedicatedProfileName(task) || (task.profile as any)?.name || "")
                            .toLowerCase().includes(profileFilter.toLowerCase());
      const matchesScript = !scriptFilter || scriptFilter === "all" || 
                           ((task as any).script?.name || "")
                           .toLowerCase().includes(scriptFilter.toLowerCase());
      const matchesStatus = !statusFilter || statusFilter === "all" || 
                           task.status.toLowerCase().includes(statusFilter.toLowerCase());
      
      return matchesSearch && matchesProfile && matchesScript && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'profile':
          const profileA = getDedicatedProfileName(a) || (a.profile as any)?.name || "No Profile";
          const profileB = getDedicatedProfileName(b) || (b.profile as any)?.name || "No Profile";
          comparison = profileA.localeCompare(profileB);
          break;
        case 'script':
          const scriptA = (a as any).script?.name || "No Script";
          const scriptB = (b as any).script?.name || "No Script";
          comparison = scriptA.localeCompare(scriptB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = a.id - b.id;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (column: 'id' | 'name' | 'profile' | 'script' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get unique values for filters
  const profileNames = tasks.map(task => {
    const profileName = getDedicatedProfileName(task) || (task.profile as any)?.name;
    return profileName && profileName.trim() !== "" ? profileName : "No Profile";
  }).filter(name => name && name.trim() !== "");
  const uniqueProfiles = Array.from(new Set(profileNames));
  
  const scriptNames = tasks.map(task => {
    const scriptName = (task as any).script?.name;
    return scriptName && scriptName.trim() !== "" ? scriptName : "No Script";
  }).filter(name => name && name.trim() !== "");
  const uniqueScripts = Array.from(new Set(scriptNames));
  
  const statusNames = tasks.map(task => task.status).filter(status => status && status.trim() !== "");
  const uniqueStatuses = Array.from(new Set(statusNames));

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Task Controls */}
      <div className="mb-6 flex items-center justify-between">                
        <div className="flex items-center space-x-4 w-full">           
          <Button
              onClick={onFetchTasks}
              disabled={isFetching || isRefreshing}
              className="bg-accent text-white hover:bg-emerald-600"
              >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Syncing..." : "Sync"}
            </Button>       

            <div className="relative">
           <Input
             type="text"
             placeholder="Search tasks, profiles, scripts, requests, responses..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10 w-64"
           />
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
         </div>

         
        </div>                          
        {/* Filters and Info */}
        <div className="flex items-center justify-between w-full">
          <div></div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {uniqueProfiles.map(profile => (
                  <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={scriptFilter} onValueChange={setScriptFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Script" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scripts</SelectItem>
                {uniqueScripts.map(script => (
                  <SelectItem key={script} value={script}>{script}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>


      {/* Task Grid */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tasks available
          </h3>
          <p className="text-gray-500 mb-6">
            Refresh tasks from Task Center to get started
          </p>
          <Button
            onClick={onFetchTasks}
            disabled={isFetching || isRefreshing}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Syncing..." : "Sync"}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 h-6">
                <TableHead className="w-[50px] py-1">
                  <button
                    onClick={() => handleSort('id')}
                    className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                      sortBy === 'id' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-50'
                    } p-1 rounded`}
                  >
                    <span>ID</span>
                    {sortBy === 'id' ? (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[200px] py-1">
                  <button
                    onClick={() => handleSort('name')}
                    className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                      sortBy === 'name' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-50'
                    } p-1 rounded`}
                  >
                    <span>Name</span>
                    {sortBy === 'name' ? (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[200px] py-1">
                  <button
                    onClick={() => handleSort('profile')}
                    className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                      sortBy === 'profile' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-50'
                    } p-1 rounded`}
                  >
                    <span>Profile</span>
                    {sortBy === 'profile' ? (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[200px] py-1">
                  <button
                    onClick={() => handleSort('script')}
                    className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                      sortBy === 'script' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-50'
                    } p-1 rounded`}
                  >
                    <span>Script</span>
                    {sortBy === 'script' ? (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[200px] text-gray-500 py-1">Actions</TableHead>
                <TableHead className="w-[50px] py-1">
                  <button
                    onClick={() => handleSort('status')}
                    className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                      sortBy === 'status' ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-50'
                    } p-1 rounded`}
                  >
                    <span>Status</span>
                    {sortBy === 'status' ? (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[50px] py-1">Handle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task, index) => (
                <TableRow
                  key={task.id}
                  className={`hover:bg-gray-100 h-6 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <TableCell className="font-medium text-sm py-1">
                    <button
                      onClick={() => handleTaskIdClick(task)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {task.id}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-left py-1">
                    <div className="max-w-md">
                      {task.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-left py-1">
                    <div className="max-w-md flex items-center gap-2">                     
                      <button
                        onClick={() => handleProfileClick(task)}
                        className={`font-medium hover:underline cursor-pointer truncate text-left ${
                          (task.profile as any).dedicatedProfileId 
                            ? "text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded" 
                            : !(task.profile as any).isDedicated 
                              ? "text-blue-600 hover:text-blue-800" 
                              : "text-gray-500 hover:text-blue-600"
                        }`}
                        title={
                          (task.profile as any).dedicatedProfileId 
                            ? "Dedicated profile assigned - click to view or change" 
                            : !(task.profile as any).isDedicated 
                              ? "Original profile from Task Center - click to view details" 
                              : "No profile assigned - click to select a profile"
                        }
                      >
                        {getDedicatedProfileName(task as any) || (task.profile as any).name || "No Profile"}
                      </button>
                    </div>
                  </TableCell>            
                  <TableCell className="text-sm text-left py-1">
                    <div className="max-w-md">
                      <button
                        onClick={() => handleScriptClick(task)}
                        className="font-medium hover:underline cursor-pointer truncate text-left text-blue-600 hover:text-blue-800"
                        title={((task as any).script?.name) || 'View script'}
                      >
                        {((task as any).script?.name) || "No Script"}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-1">
                    <div className="flex items-center space-x-1">
                      {/* Incognito Mode Indicator */}
                      <div 
                        className={`h-8 w-8 p-0 flex items-center justify-center rounded ${
                          (task.profile as any)?.isIncognito
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-600 bg-gray-50"
                        }`}
                        title={(task.profile as any)?.isIncognito ? "Incognito profile" : "Regular profile"}
                      >
                        <Users className="h-4 w-4" />
                      </div>
                      {/* Headless Mode Indicator */}
                      <div 
                        className={`h-8 w-8 p-0 flex items-center justify-center rounded ${
                          (task.profile as any)?.isHeadless
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-600 bg-gray-50"
                        }`}
                        title={(task.profile as any)?.isHeadless ? "Headless profile" : "Regular profile"}
                      >
                        {(task.profile as any)?.isHeadless ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </div>
                      
                      {/* Run/Stop Button */}
                      {task.status === 'RUNNING' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => stopTaskExecution(task.id)}
                          title="Stop task execution"
                        >
                          <Square className="h-3 w-3 fill-current" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                          onClick={() => runTaskMutation.mutate({ 
                            taskId: task.id                            
                          })}
                          disabled={
                            (!(task.profile as any).dedicatedProfileId && (!task.profile || !task.script))
                          }
                          title={
                            (task.profile as any).dedicatedProfileId
                              ? "Execute task with dedicated profile configuration"
                              : (!task.profile || !task.script)
                                ? "Task missing profile or script data"
                                : "Execute task script with profile configuration"
                          }
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                                            
                      {/* Log Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleTaskLogClick(task)}
                        title="View log file"
                      >
                        <Activity className="h-3 w-3" />
                      </Button>
                      {/* Output Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleTaskOutputClick(task)}
                        title="Show output files"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-left py-1">
                    <div className="max-w-md">
                      <Badge
                        variant={getStatusBadgeVariant(mapLegacyStatus(task.status))}
                        className={`text-xs ${getStatusBadgeClasses(mapLegacyStatus(task.status))}`}
                      >
                        {task.status
                          ? task.status.replace("_", " ").toUpperCase()
                          : "UNKNOWN"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-1">
                    <div className="flex items-center space-x-1">
                      {/* Open Browser for Testing */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                        onClick={() => openBrowserMutation.mutate(task)}
                        disabled={
                          task.status === 'RUNNING' || 
                          openBrowserMutation.isPending ||
                          (!(task.profile as any).dedicatedProfileId && (!task.profile || !task.script))
                        }
                        title={
                          task.status === 'RUNNING' 
                            ? "Cannot open browser while task is running"
                            : (task.profile as any).dedicatedProfileId
                              ? "Open Chrome browser for testing with dedicated profile"
                              : (!task.profile || !task.script)
                                ? "Task missing profile or script data"
                                : "Open Chrome browser for testing with profile configuration"
                        }
                      >
                        <Chrome className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => duplicateTaskMutation.mutate(task)}
                        title="Duplicate task to profile"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => handleClearClick(task)}
                        title="Clear task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Pagination Controls */}
      {filteredAndSortedTasks.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          {/* Items per page - Left */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 font-medium">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedTasks.length)} of {filteredAndSortedTasks.length} tasks
          </div>

          {/* Pagination Navigation - Center/Right */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const distance = Math.abs(page - currentPage);
                    return distance <= 2 || page === 1 || page === totalPages;
                  })
                  .map((page, index, arr) => {
                    const prevPage = arr[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal Components */}
      <TaskDetailsModal
        task={selectedTask as Task}
        isOpen={taskDetailsOpen}
        onClose={() => setTaskDetailsOpen(false)}
      />

      <ProfileDetailsModal
        profileData={selectedProfileData}
        isOpen={profileDetailsOpen}
        onClose={() => setProfileDetailsOpen(false)}
        isTaskProfile={true}
      />

      <ScriptDetailsModal
        scriptData={selectedScriptData}
        isOpen={scriptDetailsOpen}
        onClose={() => setScriptDetailsOpen(false)}
      />

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={`Task Log - Task ${logDetails?.taskId}`}
        content={logDetails?.content || ""}
        type="task"
        id={logDetails?.taskId}
      />

      {/* Output Details Modal */}
      <OutputDetailsModal
        isOpen={isOutputModalOpen}
        onClose={() => setIsOutputModalOpen(false)}
        title={`Output Folder - Task ${outputDetails?.taskId}`}
        path={outputDetails?.path || ""}
        files={outputDetails?.files || []}
        baseUrl={`/api/tasks/${outputDetails?.taskId}`}
      />

      {/* Profile Selection Modal */}
      <ProfileAssignment
        isOpen={isProfileSelectionOpen}
        onOpenChange={setIsProfileSelectionOpen}
        task={taskForProfileSelection}
        profiles={profiles}
      />

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Task</AlertDialogTitle>
            <AlertDialogDescription>
              All created data for this task including profiles, logs, output files, and dedicated profile assignment will be cleared permanently. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              disabled={clearTaskMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {clearTaskMutation.isPending ? "Clearing..." : "Clear Task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>     
    </div>
  );
}
