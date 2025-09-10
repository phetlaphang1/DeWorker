import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  Chrome,
  Code,
  FileText,
  Save,
  Play,
  Square,
  Eye,
  EyeOff,
  FolderOpen,
  Download,
  FileImage,
  File,
  FileVideo,
  FileAudio,
  Archive,
  Paperclip,
  Copy,
  Activity,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/libs/api";
import { useToast } from "@/hooks/use-toast";
// import CreateProfileModal from "@/components/create-profile-modal";
import ProfileDetailsModal from "@/components/profileDetails";
import {LogDetailsModal, OutputDetailsModal } from "./lib/actionsColumn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Profile } from '@shared/schema';
import {
  getStatusBadgeVariant,
  getStatusBadgeClasses,
  mapLegacyStatus
} from './lib/executionStatus';

interface ProfilesPanelProps {
  profiles: Profile[];
  isLoading: boolean;
}

export default function ProfilesPanel({
  profiles,
  isLoading,
}: ProfilesPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
    null,
  );
  const [isProfileDetailsOpen, setIsProfileDetailsOpen] = useState(false);
  const [scriptDetails, setScriptDetails] = useState<{
    profileId: number;
    content: string;
  } | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [editedScriptContent, setEditedScriptContent] = useState<string>("");
  const [logDetails, setLogDetails] = useState<{
    profileId: number;
    content: string;
  } | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [outputDetails, setOutputDetails] = useState<{
    profileId: number;
    files: any[];
    path: string;
  } | null>(null);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<any>(null);

  // Delete confirmation modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  // Real-time log viewer states
  const [isRealtimeLogOpen, setIsRealtimeLogOpen] = useState(false);
  const [realtimeLogProfile, setRealtimeLogProfile] = useState<Profile | null>(null);

  // Twitter Carring state
  const [isTwitterCarring, setIsTwitterCarring] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch settings to get isTwitterCarring flag
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.profileSettings?.isTwitterCarring !== undefined) {
          setIsTwitterCarring(data.profileSettings.isTwitterCarring);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const launchProfileMutation = useMutation({
    mutationFn: async (params: { profileId: number }) => {
      // Optimistically update the profile status
      queryClient.setQueryData(["/api/profiles"], (oldData: any) => {
        return oldData.map((profile: any) => 
          profile.id === params.profileId 
            ? { ...profile, status: "RUNNING" } 
            : profile
        );
      });

      console.log("Start Running: ");
      
      const response = await fetch(
        `/api/profiles/${params.profileId}/launch`,
        { method: "POST" }
      );
      
      console.log("Complete Running: ");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to launch profile");
      }
      const result = await response.json()
      console.log("Profile Execution Response: ", result); 
      return result ;
    },
    onMutate: async (params) => {
      // No need to do anything here since we're already updating optimistically above
    },
    onSuccess: (data, params) => {
      const execution = data.execution;
      console.log("Profile execution: ",execution); 
      
      // Only show success toast if the execution wasn't stopped
      if (execution.status !== 'STOPPED') {
        toast({
          title: `Profile [${execution.profileId}] Executed Completely`,
          description: `Script executed for ${execution.profileName} at ${new Date(execution.timestamp).toLocaleTimeString()}`,
        });
      }

      // Log execution details to console for debugging
      console.log("Profile Launch Results:", {
        profile: execution.profileName,
        config: execution.config,
        script: execution.script,
        status: execution.status,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error: any, params) => {
      // Update status to FAILED on error
      queryClient.setQueryData(["/api/profiles"], (oldData: any) => {
        return oldData.map((profile: any) => 
          profile.id === params.profileId 
            ? { ...profile, status: "FAILED" } 
            : profile
        );
      });
      
      toast({
        title:`Profile [${params.profileId}] Executed Failed`,
        description: error.message || "Failed to launch profile",
        variant: "destructive",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: api.profiles.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete profile",
        variant: "destructive",
      });
      setIsDeleteConfirmOpen(false);
      setProfileToDelete(null);
    },
  });

  const duplicateProfileMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      // Create duplicate profile data with modified name
      const duplicateData = {
        name: `${profile.name} - Copy`,
        description: profile.description || "",
        browser: profile.browser,
        userAgent: profile.userAgent,
        customUserAgent: profile.customUserAgent || "",
        viewportWidth: profile.viewportWidth,
        viewportHeight: profile.viewportHeight,
        timezone: profile.timezone,
        language: profile.language,
        useProxy: profile.useProxy,
        proxyType: profile.proxyType,
        proxyHost: profile.proxyHost || "",
        proxyPort: profile.proxyPort || "",
        proxyUsername: profile.proxyUsername || "",
        proxyPassword: profile.proxyPassword || "",
        customField: profile.customField || null,
        isHeadless: profile.isHeadless || false,
        isIncognito: profile.isIncognito || false
      };
      
      return api.profiles.create(duplicateData);
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile Duplicated",
        description: `Created "${newProfile.name}" with copied configuration`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Duplication Failed",
        description: error.message || "Failed to duplicate profile",
        variant: "destructive",
      });
    },
  });

  const stopProfileMutation = useMutation({
    mutationFn: async (params: { profileId: number }) => {
      // Optimistically update the profile status
      queryClient.setQueryData(["/api/profiles"], (oldData: any) => {
        return oldData.map((profile: any) => 
          profile.id === params.profileId 
            ? { ...profile, status: "READY" } 
            : profile
        );
      });

      console.log("Stop Running: ", params.profileId);
      
      const response = await fetch(
        `/api/profiles/${params.profileId}/stop`,
        { method: "POST" }
      );
      
      console.log("Complete Stopping: ");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to stop profile");
      }
      const result = await response.json()
      console.log("Profile Stop Response: ", result); 
      return result ;
    },
    onSuccess: (data, params) => {
      toast({
        title: `Profile [${params.profileId}] Stopped`,
        description: `Profile execution stopped successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error: any, params) => {
      // Keep status as RUNNING if stop fails (profile is still running)
      queryClient.setQueryData(["/api/profiles"], (oldData: any) => {
        return oldData.map((profile: any) => 
          profile.id === params.profileId 
            ? { ...profile, status: "RUNNING" } 
            : profile
        );
      });
      
      toast({
        title: `Profile [${params.profileId}] Stop Failed`,
        description: error.message || "Failed to stop profile",
        variant: "destructive",
      });
    },
  });

  const createNewProfileMutation = useMutation({
    mutationFn: () => {
      // Get the next profile ID by finding the highest existing ID + 1
      const maxId = profiles.length > 0 ? Math.max(...profiles.map(p => p.id)) : 0;
      const nextId = maxId + 1;
      return api.profiles.create({
        name: `Profile ${nextId}`,
        description: `Automatically generated profile ${nextId}`,
        browser: "chrome-windows",
        isHeadless:false,
        isIncognito:false,        
        userAgent: "",
        customUserAgent: "",
        viewportWidth: 1280,
        viewportHeight: 720,
        timezone: "America/New_York",
        language: "en-US",
        useProxy: false,
        proxyType: "http",
        proxyHost: "",
        proxyPort: "",
        proxyUsername: "",
        proxyPassword: "",
        status: "READY",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Success",
        description: `${data.name} profile created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const handleProfileDetailsClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsProfileDetailsOpen(true);
  };

  const getScriptContent = async (profileId: number) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/script`);
      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getLogContent = async (profileId: number) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/log`);
      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleLogClick = async (profile: Profile) => {
    try {
      const logContent = await getLogContent(profile.id);
      if (logContent) {
        setLogDetails({ profileId: profile.id, content: logContent });
        setIsLogModalOpen(true);
      } else {
        toast({
          title: "No Log Found",
          description:
            "No log file exists for this profile yet. Run the script first.",
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

  const handleLiveLogsClick = (profile: Profile) => {
    setRealtimeLogProfile(profile);
    setIsRealtimeLogOpen(true);
  };

  const handleDeleteClick = (profile: Profile) => {
    setProfileToDelete(profile);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (profileToDelete) {
      deleteProfileMutation.mutate(profileToDelete.id);
    }
  };

  const handleOutputClick = async (profile: Profile) => {
    try {
      const response = await fetch(`/api/profiles/${profile.id}/output`);
      const data = await response.json();
      setOutputDetails({ profileId: profile.id, ...data });
      setIsOutputModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch output data:', error);
      toast({
        title: "Error",
        description: "Failed to load output files",
        variant: "destructive",
      });
    }
  };

  const handleImagePreview = (file: any, profileId: number) => {
    setSelectedImageFile({ ...file, profileId });
    setImagePreviewOpen(true);
  };

  const handleFileDownload = async (file: any, profileId: number) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/output/${file.name}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const createScriptFile = async (profileId: number) => {
    const defaultContent =
      '// New script file\nconsole.log("Hello from profile script!");';
    try {
      const response = await fetch(
        `/api/profiles/${profileId}/script`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: defaultContent }),
        },
      );
      if (response.ok) {
        toast({
          title: "Success",
          description: "Script file created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });

        // Show Script Details modal after creating the file
        setScriptDetails({ profileId, content: defaultContent });
        setEditedScriptContent(defaultContent);
        setIsScriptModalOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create script file",
        variant: "destructive",
      });
    }
  };

  const showScriptDetails = async (profileId: number) => {
    const content = await getScriptContent(profileId);
    if (content !== null) {
      setScriptDetails({ profileId, content: content || "" });
      setEditedScriptContent(content || "");
      setIsScriptModalOpen(true);
    }
  };

  const updateScriptMutation = useMutation({
    mutationFn: async ({
      profileId,
      content,
    }: {
      profileId: number;
      content: string;
    }) => {
      const response = await fetch(
        `/api/profiles/${profileId}/script`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to update script");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Script updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      if (scriptDetails) {
        setScriptDetails({ ...scriptDetails, content: editedScriptContent });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update script",
        variant: "destructive",
      });
    },
  });

  // Browser management functions
  const openBrowserMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      const response = await fetch(`/api/profiles/${profile.id}/open-browser`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to open browser with profile');
      }
      return { profileId: profile.id };
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

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case "chrome":
      case "google chrome":
        return "🌐";
      case "firefox":
      case "mozilla firefox":
        return "🦊";
      case "edge":
      case "microsoft edge":
        return "🔷";
      case "safari":
        return "🧭";
      default:
        return "🌐";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  // Filter and sort profiles
  const filteredAndSortedProfiles = profiles
    .filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           profile.id.toString().includes(searchTerm);
      const matchesStatus = !statusFilter || statusFilter === "all" || 
                           profile.status.toLowerCase().includes(statusFilter.toLowerCase());
      
      return matchesSearch && matchesStatus;
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
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = a.id - b.id;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProfiles = filteredAndSortedProfiles.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (column: 'id' | 'name' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get unique values for filters
  const statusNames = profiles.map(profile => profile.status).filter(status => status && status.trim() !== "");
  const uniqueStatuses = Array.from(new Set(statusNames));

  // Profile indicator component
  const ProfileIndicator = ({ profile }: { profile: Profile }) => (
    <div className="flex items-center gap-2">
      {/* Incognito Mode Indicator */}
      <div 
        className={`h-8 w-8 p-0 flex items-center justify-center rounded ${
          profile.isIncognito
            ? "text-blue-600 bg-blue-50"
            : "text-gray-600 bg-gray-50"
        }`}
        title={profile.isIncognito ? "Incognito profile" : "Regular profile"}
      >
        <Users className="h-4 w-4" />
      </div>
      {/* Headless Mode Indicator */}
      <div 
        className={`h-8 w-8 p-0 flex items-center justify-center rounded ${
          profile.isHeadless
            ? "text-blue-600 bg-blue-50"
            : "text-gray-600 bg-gray-50"
        }`}
        title={profile.isHeadless ? "Headless profile" : "Regular profile"}
      >
        {profile.isHeadless ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </div>
    </div>
  );

  // Run button component
  const RunButton = ({ profileId }: { profileId: number }) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-7 p-0 ${
          isRunning(profileId) 
            ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100" 
            : "text-green-600 hover:text-green-700 hover:bg-green-50"
        }`}
        onClick={() => {
          if (isRunning(profileId)) {
            stopProfileMutation.mutate({ profileId });
          } else {
            launchProfileMutation.mutate({ profileId });
          }
        }}
        // disabled={launchProfileMutation.isPending || Boolean(isLoading)}
      >
        {isRunning(profileId) ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
    );
  };

  const isRunning = (profileId: number) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.status === 'RUNNING';
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Profile Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4 w-full">       
          <Button
            onClick={() => createNewProfileMutation.mutate()}
            disabled={createNewProfileMutation.isPending}
            className="bg-accent text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createNewProfileMutation.isPending ? "Creating..." : "New"}
          </Button>          
            <Input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />                     
        </div>
        
        {/* Filters and Info */}
        <div className="flex items-center justify-between w-full">
         <div></div>
          {/* Right: Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
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
      
      {/* Profiles Table */}
      {filteredAndSortedProfiles.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No profiles
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first profile to get started
          </p>
          <Button
            onClick={() => createNewProfileMutation.mutate()}
            disabled={createNewProfileMutation.isPending}
            className="bg-accent text-white hover:bg-emerald-600"
          >
            {createNewProfileMutation.isPending ? "Creating..." : "New Profile"}
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
                <TableHead className="w-[200px] text-gray-500 py-1">Script</TableHead>
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
              {paginatedProfiles.map((profile, index) => (
                <TableRow
                  key={profile.id}
                  className={`hover:bg-gray-100 h-6 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <TableCell className="font-medium text-sm text-left w-[50px] py-1">
                    {profile.id}
                  </TableCell>
                  <TableCell className="text-sm text-left py-1">
                    <div className="max-w-md">
                      <button
                        onClick={() => handleProfileDetailsClick(profile)}
                        className="font-medium hover:underline cursor-pointer truncate text-left text-blue-600 hover:text-blue-800"
                        title="View profile details"
                      >
                        {profile.name}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-left py-1">

                  <div className="max-w-md">
                      {isTwitterCarring ? (
                        <span className="font-medium text-gray-400 cursor-not-allowed" title="Script editing disabled when Twitter Carring is enabled">
                          Twitter Carring
                        </span>
                      ) : (
                        <button
                          onClick={() => showScriptDetails(profile.id)}
                          className="font-medium hover:underline cursor-pointer truncate text-left text-blue-600 hover:text-blue-800"
                          title="View script details"
                        >
                          Edit
                        </button>
                      )}
                    </div>                    
                  </TableCell>
                  <TableCell className="text-right py-1">
                    <div className="flex items-center space-x-1">
                      <ProfileIndicator profile={profile} />
                      <RunButton profileId={profile.id} />                     
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleLogClick(profile)}
                        title="View log file"
                      >
                        <Activity className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleOutputClick(profile)}
                        title="Show output files"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  
                  {/* Status Column */}
                  <TableCell className="text-sm text-left py-1">
                    <Badge
                      variant={getStatusBadgeVariant(profile.status)}
                      className={`text-xs ${getStatusBadgeClasses(profile.status)}`}
                    >
                      {mapLegacyStatus(profile.status)}
                    </Badge>
                  </TableCell>
                  
                  {/* Handle Column */}
                  <TableCell className="text-right py-1">
                    <div className="flex items-center space-x-1">
                      {/* Open Browser for Testing */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                        onClick={() => openBrowserMutation.mutate(profile)}
                        disabled={
                          profile.status === 'RUNNING' || 
                          openBrowserMutation.isPending
                        }
                        title={
                          profile.status === 'RUNNING' 
                            ? "Cannot open browser while profile is running"
                            : "Open Chrome browser for testing with profile configuration"
                        }
                      >
                        <Chrome className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => duplicateProfileMutation.mutate(profile)}
                        disabled={duplicateProfileMutation.isPending}
                        title="Duplicate profile with same configuration"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteClick(profile)}
                        title="Delete profile and all associated data"
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
      {filteredAndSortedProfiles.length > 0 && (
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedProfiles.length)} of {filteredAndSortedProfiles.length} profiles
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

      {/* <CreateProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      /> */}

      <ProfileDetailsModal
        profileData={selectedProfile}
        isOpen={isProfileDetailsOpen}
        onClose={() => setIsProfileDetailsOpen(false)}
      />

      <Dialog open={isScriptModalOpen} onOpenChange={setIsScriptModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Script Details - Profile {scriptDetails?.profileId}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Code:</label>
              <div className="relative">
                <CodeEditor
                  value={editedScriptContent}
                  language="js"
                  placeholder="// Enter your JavaScript code here..."
                  onChange={(evn) => setEditedScriptContent(evn.target.value)}
                  padding={15}
                  style={{
                    fontSize: 14,
                    backgroundColor: "#1e293b",
                    fontFamily:
                      'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
                    minHeight: "400px",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                  }}
                  data-color-mode="dark"
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  JavaScript
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsScriptModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (scriptDetails) {
                    updateScriptMutation.mutate({
                      profileId: scriptDetails.profileId,
                      content: editedScriptContent,
                    });
                  }
                }}
                disabled={updateScriptMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateScriptMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={`Script Log - Profile ${logDetails?.profileId}`}
        content={logDetails?.content || ""}
        type="profile"
        id={logDetails?.profileId}
      />

      {/* Output Details Modal */}
      <OutputDetailsModal
        isOpen={isOutputModalOpen}
        onClose={() => setIsOutputModalOpen(false)}
        title={`Output Folder - Profile ${outputDetails?.profileId}`}
        path={outputDetails?.path || ""}
        files={outputDetails?.files || []}
        baseUrl={`/api/profiles/${outputDetails?.profileId}`}
      />

      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-green-600" />
              Image Preview - {selectedImageFile?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImageFile && (
              <div className="text-center">
                <img 
                  src={`/api/profiles/${selectedImageFile.profileId}/output/${selectedImageFile.name}`}
                  alt={selectedImageFile.name}
                  className="max-w-full max-h-[60vh] object-contain mx-auto border rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.removeAttribute('style');
                  }}
                />
                <div className="hidden text-center py-8 text-gray-500">
                  <FileImage className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Unable to load image preview</p>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>File: {selectedImageFile.name}</p>
                  <p>Size: {selectedImageFile.size ? (selectedImageFile.size / 1024).toFixed(2) + ' KB' : 'Unknown'}</p>
                  <p>Modified: {selectedImageFile.mtime ? new Date(selectedImageFile.mtime).toLocaleString() : 'Unknown'}</p>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => handleFileDownload(selectedImageFile, selectedImageFile.profileId)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              All data of this profile will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProfileMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProfileMutation.isPending ? "Deleting..." : "Delete Profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
