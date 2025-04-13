"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, PlusCircle } from "lucide-react";
import { ResumeServerData } from "@/lib/types";
import { createResumeGroup } from "./actions";
import { useToast } from "@/hooks/use-toast";
import LoadingButton from "@/components/LoadingButton";
import { useTransition } from "react";

export interface ResumeGroup {
  id: string;
  name: string;
  resumeIds: string[]; // Array of resume IDs
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResumeGroupManagerProps {
  resumes: ResumeServerData[];
  onCreateGroup: (group: ResumeGroup) => void;
}

export default function ResumeGroupManager({ resumes, onCreateGroup }: ResumeGroupManagerProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    
    startTransition(async () => {
      try {
        const newGroup = await createResumeGroup(groupName.trim(), selectedResumeIds);
        
        // Let the parent component know
        onCreateGroup(newGroup);
        
        // Reset form and close dialog
        setOpen(false);
        setGroupName("");
        setSelectedResumeIds([]);
        
        toast({
          title: "Group created",
          description: `Group "${groupName}" has been created successfully.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create group. Please try again.",
        });
      }
    });
  };

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumeIds(prev => 
      prev.includes(resumeId)
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <FolderPlus className="h-3 w-3" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="text-base">Create Resume Group</DialogTitle>
          <DialogDescription className="text-xs">
            Create a custom group to organize your resumes. You can create an empty group and add resumes later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Group Name</Label>
            <Input
              id="name"
              placeholder="E.g., Software Engineer Applications"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Select Resumes (Optional)</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md p-1.5 space-y-1.5">
              {resumes.length === 0 ? (
                <p className="text-xs text-muted-foreground p-1.5">No resumes available</p>
              ) : (
                resumes.map(resume => (
                  <div 
                    key={resume.id} 
                    className="flex items-center space-x-1.5 p-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleResumeSelection(resume.id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedResumeIds.includes(resume.id)}
                      onChange={() => {}}
                      className="h-3 w-3"
                    />
                    <span className="text-xs">
                      {resume.title || "Untitled Resume"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <LoadingButton
            loading={isPending}
            onClick={handleCreateGroup} 
            disabled={!groupName.trim()}
            size="sm"
            className="text-xs"
          >
            Create Group
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 