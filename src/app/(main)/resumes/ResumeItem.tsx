"use client";

import LoadingButton from "@/components/LoadingButton";
import ResumePreview from "@/components/ResumePreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ResumeServerData } from "@/lib/types";
import { mapToResumeValues } from "@/lib/utils";
import { formatDate } from "date-fns";
import { MoreVertical, Copy, Trash2, FileText, FolderPlus, FolderX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, useEffect } from "react";
import { deleteResume, duplicateResume } from "./actions";

interface ResumeItemProps {
  resume: ResumeServerData;
  onAddToGroup?: (resumeId: string) => void;
  onRemoveFromGroup?: (resumeId: string) => void;
  inCustomGroup?: boolean;
  groupName?: string;
  onDeleted?: (resumeId: string) => void;
}

export default function ResumeItem({ 
  resume, 
  onAddToGroup, 
  onRemoveFromGroup, 
  inCustomGroup, 
  groupName,
  onDeleted
}: ResumeItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wasUpdated = resume.updatedAt !== resume.createdAt;
  const { toast } = useToast();
  const [isDuplicating, startDuplicating] = useTransition();
  const router = useRouter();

  const handleDuplicate = () => {
    startDuplicating(async () => {
      try {
        await duplicateResume(resume.id);
        
        const successMessage = inCustomGroup 
          ? `Resume duplicated and added to the same group (${groupName}).`
          : "Resume duplicated successfully.";
        
        toast({
          title: "Resume duplicated",
          description: successMessage,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          description: "Failed to duplicate resume. Please try again.",
        });
      }
    });
  };

  const handleAddToGroup = () => {
    if (onAddToGroup) {
      onAddToGroup(resume.id);
    }
  };
  
  const handleRemoveFromGroup = () => {
    if (onRemoveFromGroup) {
      onRemoveFromGroup(resume.id);
    }
  };

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary h-full flex flex-col" data-testid="resume-card">
      <div className="flex-1">
        <Link
          href={`/editor?resumeId=${resume.id}`}
          className="flex flex-col h-full pr-6"
        >
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <h3 className="text-base font-medium text-foreground break-words line-clamp-2">
              {resume.title || "No title"}
            </h3>
          </div>
          
          {resume.description && (
            <div className="mt-3 text-xs text-muted-foreground flex-1">
              <p className="line-clamp-4">{resume.description}</p>
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{wasUpdated ? "Updated" : "Created"} on {formatDate(resume.updatedAt, "MMM d, yyyy")}</span>
          </div>
        </Link>
        
        <div ref={contentRef} className="hidden">
          <ResumePreview
            resumeData={mapToResumeValues(resume)}
          />
        </div>
      </div>
      
      <div className="absolute right-2 top-2">
        <MoreMenu 
          resumeId={resume.id} 
          onDuplicateClick={handleDuplicate} 
          isDuplicating={isDuplicating}
          onAddToGroup={onAddToGroup ? handleAddToGroup : undefined}
          onRemoveFromGroup={onRemoveFromGroup ? handleRemoveFromGroup : undefined}
          inCustomGroup={inCustomGroup}
          groupName={groupName}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}

interface MoreMenuProps {
  resumeId: string;
  onDuplicateClick: () => void;
  isDuplicating: boolean;
  onAddToGroup?: () => void;
  onRemoveFromGroup?: () => void;
  inCustomGroup?: boolean;
  groupName?: string;
  onDeleted?: (resumeId: string) => void;
}

function MoreMenu({ 
  resumeId, 
  onDuplicateClick, 
  isDuplicating, 
  onAddToGroup, 
  onRemoveFromGroup,
  inCustomGroup,
  groupName,
  onDeleted
}: MoreMenuProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-70 transition-opacity group-hover:opacity-100 h-6 w-6"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex items-center gap-2 text-sm"
            onClick={onDuplicateClick}
            disabled={isDuplicating}
          >
            <Copy className="size-3" />
            Duplicate
          </DropdownMenuItem>
          
          {inCustomGroup && (
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm"
              onClick={onRemoveFromGroup}
            >
              <FolderX className="size-3" />
              Remove from {groupName || "group"}
            </DropdownMenuItem>
          )}
          
          {!inCustomGroup && onAddToGroup && (
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm"
              onClick={onAddToGroup}
            >
              <FolderPlus className="size-3" />
              Add to group
            </DropdownMenuItem>
          )}
          
          {(onAddToGroup || onRemoveFromGroup) && <DropdownMenuSeparator />}
          
          <DropdownMenuItem
            className="flex items-center gap-2 text-sm"
            onClick={() => setShowDeleteConfirmation(true)}
          >
            <Trash2 className="size-3" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirmationDialog
        resumeId={resumeId}
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onDeleted={onDeleted}
      />
    </>
  );
}

interface DeleteConfirmationDialogProps {
  resumeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (resumeId: string) => void;
}

function DeleteConfirmationDialog({
  resumeId,
  open,
  onOpenChange,
  onDeleted
}: DeleteConfirmationDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleDelete() {
    startTransition(async () => {
      try {
        await deleteResume(resumeId);
        onOpenChange(false);
        
        // Call the onDeleted callback to update client-side state first
        if (onDeleted) {
          onDeleted(resumeId);
        }
        
        toast({
          title: "Resume deleted",
          description: "Your resume has been successfully deleted.",
        });
        
        // Force refresh the router to ensure server data is re-fetched
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          description: "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Delete resume?</DialogTitle>
          <DialogDescription className="text-sm">
            This will permanently delete this resume. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <LoadingButton
            variant="destructive"
            onClick={handleDelete}
            loading={isPending}
            size="sm"
          >
            Delete
          </LoadingButton>
          <Button variant="secondary" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
