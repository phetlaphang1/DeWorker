import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, UserPlus } from 'lucide-react';
import type { Task } from '@shared/schema';

export function ProfileAssignment({
  isOpen,
  onOpenChange,
  task,
  profiles,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  profiles: any[];
  onSuccess?: (profileId: number) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const assignProfileMutation = useMutation({
    mutationFn: async ({ taskId, profileId }: { taskId: number; profileId: number }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileData: {
            dedicatedProfileId: profileId,
            isDedicated: true
          }
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign profile');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Profile Assigned',
        description: 'Browser profile has been assigned to the task successfully',
      });
      onOpenChange(false);
      setSelectedProfileId(null);
      onSuccess?.(variables.profileId);
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign profile to task',
        variant: 'destructive',
      });
    },
  });

  const handleProfileAssignment = () => {
    if (task && selectedProfileId) {
      assignProfileMutation.mutate({
        taskId: task.id,
        profileId: selectedProfileId,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Select Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a profile to assign to Task {task?.id}:
          </p>
          
          <Select value={selectedProfileId?.toString() || ""} onValueChange={(value) => setSelectedProfileId(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a profile..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.name}</span>
                    <span className="text-xs text-gray-500">ID: {profile.id}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedProfileId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileAssignment}
              disabled={!selectedProfileId || assignProfileMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {assignProfileMutation.isPending ? 'Assigning...' : 'Assign Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
