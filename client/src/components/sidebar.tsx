import {
  ListTodo,
  Users,
  Settings,
  Server,
  Download,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: "tasks" | "profiles" | "settings" | "automation";
  onTabChange: (tab: "tasks" | "profiles" | "settings" | "automation") => void;
  taskCount: number;
  runningTaskCount: number;
  profileCount: number;
  runningProfileCount: number;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  taskCount,
  runningTaskCount,
  profileCount,
  runningProfileCount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 relative">
        <div className="flex items-center space-x-3">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-semibold ">
                Worker
              </h1>
              <p className="text-sm">
                Task & Profile Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-4">
          {/* Task Management Section */}
          <div>
            <ul>
              <li>
                <button
                  onClick={() => onTabChange("tasks")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "tasks"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Tasks" : ""}
                >
                  <ListTodo
                    className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>Tasks</span>
                      <div className="flex gap-1">
                        <span className={`text-sm font-medium ${activeTab === 'tasks' ? 'text-white' : 'text-muted-foreground'}`}>
                          {taskCount}
                        </span>
                        {runningTaskCount > 0 && (
                          <span className="text-sm font-medium">({runningTaskCount})</span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* Profile Management Section */}
          <div>
            <ul>
              <li>
                <button
                  onClick={() => onTabChange("profiles")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "profiles"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Profiles" : ""}
                >
                  <Users className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`} />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>Profiles</span>
                      <div className="flex gap-1">
                        <span className={`text-sm font-medium ${activeTab === 'profiles' ? 'text-white' : 'text-muted-foreground'}`}>
                          {profileCount}
                        </span>
                        {runningProfileCount > 0 && (
                          <span className="text-sm font-medium">({runningProfileCount})</span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* System Management Section */}
          <div>
            <ul>
              <li>
                <button
                  onClick={() => onTabChange("settings")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "settings"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Settings" : ""}
                >
                  <Settings
                    className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`}
                  />
                  {!isCollapsed && "Settings"}
                </button>
              </li>
            </ul>
          </div>

          {/* Automation Section (NEW) */}
          <div>
            <ul>
              <li>
                <button
                  onClick={() => onTabChange("automation")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === "automation"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Automation" : ""}
                >
                  <Download className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`} />
                  {!isCollapsed && "Automation"}
                </button>
              </li>
            </ul>
          </div>

          {/* Collapse Button */}
          <div>
            <ul>
              <li>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isCollapsed ? (
                    <ChevronRight
                      className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`}
                    />
                  ) : (
                    <ChevronLeft
                      className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`}
                    />
                  )}
                  {!isCollapsed && "Collapse"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200">
        <ul>
          <li>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Logout" : ""}
            >
              <LogOut className={`w-6 h-6 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && "Logout"}
            </button>
          </li>
        </ul>
      </div>

      {/* Connection Status */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-secondary">Task Center Connected</span>
            </div>
            <span className="text-xs text-gray-400">2min ago</span>
          </div>
        </div>
      )}
    </div>
  );
}
