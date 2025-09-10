import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Server,
  Clock,
  Database,
  Code,
  Settings,
  UserPlus,
} from "lucide-react";
import { TaskCenterTask } from '../../../shared/schema';
import { useState, useEffect, useRef } from 'react';
import { ProfileAssignment } from './profileAssignment';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import JSONEditor, { JSONEditorMode, JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

interface Task {
  id: number;
  name: string;
  description: string;
  status: string; 
  profileId: number | null;
  scriptId: number | null;  
  profile: unknown;
  script: unknown;
  request: unknown;
  response: unknown;
  created: Date;
  lastUpdated: Date | null;
}

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JsonDataEditor = ({ data }: { data: unknown }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const options: JSONEditorOptions = {
        mode: 'view' as JSONEditorMode,
        modes: ['tree', 'view', 'form', 'code', 'text'] as JSONEditorMode[],
        search: true,
        history: false,
        navigationBar: true,
        statusBar: true,
      };

      editorRef.current = new JSONEditor(containerRef.current, options);
      editorRef.current.set(data);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.set(data);
    }
  }, [data]);

  return <div ref={containerRef} className="h-full min-h-[400px] max-h-[60vh] overflow-auto border rounded-md" />;
};

const TaskDetailsModal = ({ task, isOpen, onClose }: TaskDetailsModalProps) => {
  if (!task) return null;
  const [localProfileData, setLocalProfileData] = useState<NonNullable<TaskCenterTask['profile']> | null>(
    task.profile ? { ...(task.profile as NonNullable<TaskCenterTask['profile']>) } : null
  );
  
  const profileName = localProfileData?.name ?? 'No profile';
  const isDedicated = localProfileData?.isDedicated ?? false;
  const dedicatedProfileId = localProfileData?.dedicatedProfileId ?? null;

  const scriptData = (task as any).script;
  const scriptName = scriptData?.name ?? 'No script';
  // Fetch profiles for selection
  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: () => fetch("/api/profiles").then(res => res.json()),
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "failed":
        return "destructive";
      case "ready":
        return "outline";
      case "new":
        return "secondary";
      default:
        return "outline";
    }
  };

  const [isDedicatedProfileOpen, setIsDedicatedProfileOpen] = useState(false);
  const [selectedDedicatedProfile, setSelectedDedicatedProfile] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  const handleProfileAssigned = (newProfileId: number) => {
    // setLocalProfileData(prev => {
    //   if (!prev) {
    //     return {
    //       id: 0,
    //       userId: 0,
    //       name: '',
    //       browser: '',
    //       userAgent: '',
    //       proxy: null,
    //       isDedicated: true,
    //       dedicatedProfileId: newProfileId,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString()
    //     };
    //   }
    //   return {
    //     ...prev,
    //     isDedicated: true,
    //     dedicatedProfileId: newProfileId
    //   };
    // });
    // queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    // setIsDedicatedProfileOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] w-[90vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            Task Details - ID {task.id}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile Data</TabsTrigger>
            <TabsTrigger value="script">Script Data</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="schema">Full Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 w-full min-w-0 flex-1 overflow-auto">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Task Center ID
                </label>
                <p className="text-sm font-semibold">
                  {task.id}
                </p>
              </div>              
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>              
            </div>

            {/* Task Content */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-sm font-medium">{task.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-sm text-gray-700">{task.description}</p>
              </div>
            </div>

            {/* Profile & Script Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Profile Name
                </label>
                <p className="text-base">                  
                  {profileName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Script Name
                </label>
                <p className="text-base">
                  {scriptName}
                </p>
              </div>
            </div>

            {/* Dedicated Profile Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Dedicated Profile
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant={isDedicated ? 'default' : 'outline'}>
                    {isDedicated ? 'YES' : 'NO'}
                  </Badge>
                  {isDedicated && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsDedicatedProfileOpen(true)}
                    >
                      Change
                    </Button>
                  )}
                </div>
              </div>
              {isDedicated && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Dedicated Profile ID
                  </label>
                  <p className="text-sm">{dedicatedProfileId || 'Not selected'}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created
                </label>
                <p className="text-sm text-gray-600">
                  {new Date(task.created).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {task.lastUpdated && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-600">
                    {new Date(task.lastUpdated).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="w-full min-w-0 flex-1 overflow-hidden">
            {task.profile ? (
              <JsonDataEditor data={task.profile} />
            ) : (
              <p>No profile data available for this task</p>
            )}
          </TabsContent>

          <TabsContent value="script" className="w-full min-w-0 flex-1 overflow-hidden">
            {task.script ? (
              <JsonDataEditor data={task.script} />
            ) : (
              <p>No script data available for this task</p>
            )}
          </TabsContent>

          <TabsContent value="request" className="w-full min-w-0 flex-1 overflow-hidden">
            {task.request ? (
              <JsonDataEditor data={(() => {
                try {
                  if (typeof task.request === 'object') {
                    return task.request;
                  }
                  return JSON.parse(task.request as string);
                } catch (e) {
                  return { raw: task.request as string };
                }
              })()} />
            ) : (
              <p>No request data available for this task</p>
            )}
          </TabsContent>

          <TabsContent value="response" className="w-full min-w-0 flex-1 overflow-hidden">
            {task.response ? (
              <JsonDataEditor data={task.response}/>
            ) : (
              <p>No response data available for this task</p>
            )}
          </TabsContent>

          <TabsContent value="schema" className="w-full min-w-0 flex-1 overflow-hidden">
            <JsonDataEditor data={{
              id: task.id,
              name: task.name,
              description: task.description,
              status: task.status,                  
              profileData: task.profile,
              scriptData: task.script,
              request: task.request,
              response: task.response,
              created: task.created,
              lastUpdated: task.lastUpdated,
            }} />
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ProfileAssignment
        isOpen={isDedicatedProfileOpen}
        onOpenChange={setIsDedicatedProfileOpen}
        task={task as any}
        profiles={profiles}
        onSuccess={(profileId: number) => handleProfileAssigned(profileId)}
      />



    </Dialog>
  );
}


export default TaskDetailsModal;
