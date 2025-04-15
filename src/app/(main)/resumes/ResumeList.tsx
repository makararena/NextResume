"use client";

import { Card } from "@/components/ui/card";
import { ResumeServerData } from "@/lib/types";
import { useState, useMemo, useEffect, useTransition, useRef } from "react";
import ResumeItem from "./ResumeItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Filter, SortDesc, ChevronRight, ChevronDown, AlertTriangle, 
  FolderPlus, Copy, Calendar, CalendarDays, CalendarIcon, Trash2, Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ResumeGroupManager, { ResumeGroup } from "./ResumeGroupManager";
import CreateResumeButton from "./CreateResumeButton";
import { deleteResumeGroup, getResumeGroups, updateResumeGroup } from "./actions";
import { useToast } from "@/hooks/use-toast";
import LoadingButton from "@/components/LoadingButton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResumeListProps {
  initialResumes: ResumeServerData[];
  totalCount: number;
  canCreate?: boolean;
}

// Generate a plausible job title from resume data
function generateJobTitle(resume: ResumeServerData): string {
  if (resume.jobTitle) return resume.jobTitle;
  if (resume.title?.includes(" - ")) {
    return resume.title.split(" - ")[0];
  }
  return resume.title || "Untitled Resume";
}

// Define type for resume groups with custom properties
interface ResumeGroupDisplay {
  id: string;
  name: string;
  resumes: ResumeServerData[];
  isCustom?: boolean;
}

// Group resumes by job title/category
function groupResumesByJobTitle(resumes: ResumeServerData[]): ResumeGroupDisplay[] {
  const groups: Record<string, ResumeServerData[]> = {};
  
  // Group resumes by job title
  resumes.forEach(resume => {
    const jobTitle = generateJobTitle(resume);
    if (!groups[jobTitle]) {
      groups[jobTitle] = [];
    }
    groups[jobTitle].push(resume);
  });
  
  // Convert groups to array format with consistent IDs based on name
  return Object.entries(groups).map(([name, resumes]) => ({
    id: `job-title-${name.replace(/\s+/g, '-').toLowerCase()}`,
    name,
    resumes,
  }));
}

type SortOption = "recent" | "oldest" | "name";
type GroupOption = "job-title" | "custom" | "none";

export default function ResumeList({ initialResumes, totalCount, canCreate = false }: ResumeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [groupOption, setGroupOption] = useState<GroupOption>("job-title");
  const [customGroups, setCustomGroups] = useState<ResumeGroup[]>([]);
  const [isLoading, startTransition] = useTransition();
  const { toast } = useToast();
  
  // Client-side state for resume list
  const [resumes, setResumes] = useState<ResumeServerData[]>(initialResumes);
  
  // Update client-side state when initialResumes changes
  useEffect(() => {
    setResumes(initialResumes);
  }, [initialResumes]);
  
  // Load stored preferences from localStorage on client-side only
  useEffect(() => {
    // Get saved sort option from localStorage
    const savedSortOption = localStorage.getItem('resumeSortOption');
    if (savedSortOption) {
      setSortOption(savedSortOption as SortOption);
    }
    
    // Get saved group option from localStorage
    const savedGroupOption = localStorage.getItem('resumeGroupOption');
    if (savedGroupOption) {
      setGroupOption(savedGroupOption as GroupOption);
    }
  }, []);
  
  // Save sort option to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('resumeSortOption', sortOption);
  }, [sortOption]);
  
  // Save group option to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('resumeGroupOption', groupOption);
  }, [groupOption]);
  
  // State for group renaming
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isRenaming, startRenameTransition] = useTransition();
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // For selecting a group to add a resume to
  const [addToGroupResumeId, setAddToGroupResumeId] = useState<string | null>(null);
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  
  // Error boundary effect
  useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Focus the input field when the dialog opens
  useEffect(() => {
    if (renameGroupId && renameInputRef.current) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 100);
    }
  }, [renameGroupId]);
  
  // Fetch custom groups from server on component mount
  useEffect(() => {
    startTransition(async () => {
      try {
        const groups = await getResumeGroups();
        setCustomGroups(groups);
      } catch (error) {
        console.error("Failed to fetch resume groups:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load resume groups. Please refresh the page.",
        });
      }
    });
  }, [toast]);
  
  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit search query length to prevent DoS
    const value = e.target.value;
    if (value.length <= 100) {
      setSearchQuery(value);
    }
  };
  
  // Filter and sort resumes
  const filteredAndSortedResumes = useMemo(() => {
    // First filter resumes based on search query
    let filtered = resumes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = resumes.filter(resume => 
        (resume.title?.toLowerCase().includes(query)) ||
        (resume.jobTitle?.toLowerCase().includes(query)) ||
        (resume.description?.toLowerCase().includes(query))
      );
    }
    
    // Then sort the filtered resumes
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });
  }, [resumes, searchQuery, sortOption]);
  
  // Group resumes based on selected grouping option
  const resumeGroups = useMemo(() => {
    switch (groupOption) {
      case "job-title": {
        const groups = groupResumesByJobTitle(filteredAndSortedResumes);
        // Only return non-empty groups
        return groups.filter(group => group.resumes.length > 0);
      }
      case "custom":
        // Map custom groups to include actual resume objects, allowing empty groups
        return customGroups.map(group => {
          const groupResumes = resumes.filter(resume => 
            group.resumeIds.includes(resume.id)
          );
          return {
            id: group.id,
            name: group.name,
            resumes: groupResumes,
            isCustom: true
          } as ResumeGroupDisplay;
        });
      case "none":
      default:
        // Only show the All Resumes group if there are resumes
        if (filteredAndSortedResumes.length === 0) {
          return [];
        }
        return [{ 
          id: "all-resumes", 
          name: "All Resumes", 
          resumes: filteredAndSortedResumes 
        }] as ResumeGroupDisplay[];
    }
  }, [filteredAndSortedResumes, groupOption, customGroups, resumes]);
  
  // Handle creating a new custom group
  const handleCreateGroup = (group: ResumeGroup) => {
    // Sanitize group name to prevent XSS
    const sanitizedGroup = {
      ...group,
      name: group.name.replace(/[<>&"']/g, '')
    };
    
    setCustomGroups(prev => [...prev, sanitizedGroup]);
    setGroupOption("custom"); // Switch to custom groups view
  };
  
  // Handle deleting a custom group
  const handleDeleteGroup = (groupId: string) => {
    startTransition(async () => {
      try {
        await deleteResumeGroup(groupId);
        setCustomGroups(prev => prev.filter(group => group.id !== groupId));
        toast({
          title: "Group deleted",
          description: "The group has been deleted successfully.",
        });
      } catch (error) {
        console.error("Failed to delete group:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete group. Please try again.",
        });
      }
    });
  };
  
  // Handle adding a resume to a group
  const handleAddResumeToGroup = (groupId: string, resumeId: string) => {
    const group = customGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Don't add if already in the group
    if (group.resumeIds.includes(resumeId)) return;
    
    const updatedResumeIds = [...group.resumeIds, resumeId];
    
    startTransition(async () => {
      try {
        await updateResumeGroup(groupId, { resumeIds: updatedResumeIds });
        
        // Update local state
        setCustomGroups(prev => 
          prev.map(g => 
            g.id === groupId 
              ? { ...g, resumeIds: updatedResumeIds }
              : g
          )
        );
        
        toast({
          title: "Resume added",
          description: "Resume added to group successfully.",
        });
      } catch (error) {
        console.error("Failed to add resume to group:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update group. Please try again.",
        });
      }
    });
  };
  
  // Handle removing a resume from a group
  const handleRemoveResumeFromGroup = (groupId: string, resumeId: string) => {
    const group = customGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const updatedResumeIds = group.resumeIds.filter(id => id !== resumeId);
    
    startTransition(async () => {
      try {
        await updateResumeGroup(groupId, { resumeIds: updatedResumeIds });
        
        // Update local state
        setCustomGroups(prev => 
          prev.map(g => 
            g.id === groupId 
              ? { ...g, resumeIds: updatedResumeIds }
              : g
          )
        );
        
        toast({
          title: "Resume removed",
          description: "Resume removed from group successfully.",
        });
      } catch (error) {
        console.error("Failed to remove resume from group:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update group. Please try again.",
        });
      }
    });
  };
  
  // Handle resume deletion - update local state and reload the page
  const handleResumeDeleted = (resumeId: string) => {
    // Remove the resume from the local state
    setResumes(prev => prev.filter(resume => resume.id !== resumeId));
    
    // Also remove the resume from any custom groups that might contain it
    if (customGroups.length > 0) {
      setCustomGroups(prev => 
        prev.map(group => ({
          ...group,
          resumeIds: group.resumeIds.filter(id => id !== resumeId)
        }))
      );
    }
    
    // Reload the page after a short delay to allow toast messages to be seen
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  // Handle renaming a group
  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!newName.trim()) return;
    
    // Sanitize the input to prevent XSS attacks
    const sanitizedName = newName.trim().replace(/[<>&"']/g, '');
    
    startRenameTransition(async () => {
      try {
        await updateResumeGroup(groupId, { name: sanitizedName });
        
        // Update local state
        setCustomGroups(prev => 
          prev.map(g => 
            g.id === groupId 
              ? { ...g, name: sanitizedName }
              : g
          )
        );
        
        setRenameGroupId(null);
        setNewGroupName("");
        
        toast({
          title: "Group renamed",
          description: "Group renamed successfully.",
        });
      } catch (error) {
        console.error("Failed to rename group:", error);
        
        // More detailed error handling
        let errorMessage = "Failed to rename group. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      }
    });
  };

  // Handle key press in rename dialog
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && renameGroupId && newGroupName.trim()) {
      e.preventDefault();
      handleRenameGroup(renameGroupId, newGroupName);
    }
  };

  // If error occurred, show a simple UI to allow user to reload
  if (hasError) {
    return (
      <div className="text-center py-8 bg-card rounded-lg shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-medium mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mb-4">
          An error occurred while loading your resumes.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search, Filter & Group Manager */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3 w-3 text-muted-foreground" />
          </div>
          <Input
            className="pl-8 h-8 bg-background text-sm"
            placeholder="Search resumes by title or content"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && <CreateResumeButton />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Filter className="mr-1.5 h-3 w-3" /> Group By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setGroupOption("job-title")}
              >
                Group by job title
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setGroupOption("custom")}
              >
                Use custom groups
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setGroupOption("none")}
              >
                No grouping
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <SortDesc className="mr-1.5 h-3 w-3" /> Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setSortOption("recent")}
              >
                <Calendar className="h-3 w-3" />
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setSortOption("oldest")}
              >
                <CalendarDays className="h-3 w-3" />
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setSortOption("name")}
              >
                <Copy className="h-3 w-3" />
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ResumeGroupManager 
            resumes={resumes} 
            onCreateGroup={handleCreateGroup} 
          />
        </div>
      </div>
      
      {/* Empty state */}
      {filteredAndSortedResumes.length === 0 && (
        <div className="text-center py-8 bg-card rounded-lg shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium mb-2">No resumes found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? `No resumes matching "${searchQuery}"` : "You haven't created any resumes yet."}
          </p>
        </div>
      )}
      
      {/* Empty state for custom groups */}
      {groupOption === "custom" && customGroups.length === 0 && (
        <div className="text-center py-8 bg-card rounded-lg shadow-sm">
          <FolderPlus className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium mb-2">No custom groups</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create custom groups to organize your resumes.
          </p>
        </div>
      )}
      
      {/* Resume Groups */}
      {resumeGroups.length > 0 && (
        <div className="space-y-3">
          {resumeGroups.map(group => (
            <Collapsible
              key={group.id}
              className="bg-card rounded-lg shadow-sm overflow-hidden group"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">
                    {group.name}
                    <Badge variant="outline" className="ml-2 py-0 h-4 text-xs">
                      {group.resumes.length}
                    </Badge>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {group.isCustom && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background cursor-pointer hover:bg-muted hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameGroupId(group.id);
                                setNewGroupName(group.name);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p>Rename group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p>Delete group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-3">
                {group.resumes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.resumes.map(resume => (
                      <ResumeItem 
                        key={resume.id} 
                        resume={resume} 
                        inCustomGroup={group.isCustom}
                        groupName={group.name}
                        onDeleted={handleResumeDeleted}
                        onAddToGroup={group.isCustom ? undefined : (
                          customGroups.length > 0 
                            ? (resumeId) => {
                                // Show dropdown to add to a specific group
                                const availableGroups = customGroups.filter(g => !g.resumeIds.includes(resumeId));
                                if (availableGroups.length === 0) {
                                  toast({
                                    title: "No available groups",
                                    description: "Resume is already in all custom groups.",
                                  });
                                  return;
                                }
                                
                                // If there's only one group, add to it directly
                                if (availableGroups.length === 1) {
                                  handleAddResumeToGroup(availableGroups[0].id, resumeId);
                                  return;
                                }
                                
                                // Otherwise set state to show a group selection dialog
                                setAddToGroupResumeId(resumeId);
                              }
                            : undefined
                        )}
                        onRemoveFromGroup={
                          group.isCustom 
                            ? (resumeId) => handleRemoveResumeFromGroup(group.id, resumeId)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No resumes in this group yet.</p>
                    {canCreate && (
                      <div className="mt-3">
                        <CreateResumeButton />
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
      
      {/* Add Rename Dialog */}
      <Dialog 
        open={renameGroupId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setRenameGroupId(null);
            setNewGroupName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-base">Rename Group</DialogTitle>
            <DialogDescription className="text-xs">
              Enter a new name for this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="text-sm">Group Name</Label>
              <Input
                id="new-name"
                placeholder="Enter new group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                className="h-8 text-sm"
                ref={renameInputRef}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setRenameGroupId(null);
                setNewGroupName("");
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              loading={isRenaming}
              onClick={() => renameGroupId && handleRenameGroup(renameGroupId, newGroupName)} 
              disabled={!newGroupName.trim()}
              size="sm"
              className="text-xs"
            >
              Rename
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add to Group Dialog */}
      <Dialog 
        open={addToGroupResumeId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setAddToGroupResumeId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-base">Add to Group</DialogTitle>
            <DialogDescription className="text-xs">
              Select a group to add this resume to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="max-h-48 overflow-y-auto rounded-md border p-1.5 divide-y divide-border">
              {customGroups
                .filter(g => !g.resumeIds.includes(addToGroupResumeId || ''))
                .map(group => (
                  <div 
                    key={group.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      if (addToGroupResumeId) {
                        handleAddResumeToGroup(group.id, addToGroupResumeId);
                        setAddToGroupResumeId(null);
                      }
                    }}
                  >
                    <FolderPlus className="h-4 w-4 text-primary" />
                    <span className="text-sm">{group.name}</span>
                    <Badge className="ml-auto text-xs">{group.resumeIds.length}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 