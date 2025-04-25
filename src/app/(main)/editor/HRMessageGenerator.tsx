"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { MessageCircle, Loader, MessageSquare, Copy, Check, RotateCcw } from "lucide-react";
import { generateHRMessage } from "./actions";
import { toast } from "sonner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface HRMessageGeneratorProps {
  resumeId: string;
}

export default function HRMessageGenerator({
  resumeId,
}: HRMessageGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingJobDesc, setIsFetchingJobDesc] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hrMessage, setHRMessage] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { canUseAIGeneration } = useSubscriptionLimits();
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // Save job description to localStorage when it changes
  useEffect(() => {
    if (jobDesc.trim()) {
      localStorage.setItem('lastJobDescription', jobDesc);
    }
  }, [jobDesc]);

  // Fetch job description when dialog opens
  const fetchJobDescription = async () => {
    if (!resumeId) return;
    
    try {
      setIsFetchingJobDesc(true);
      
      // First try to get from API for the current resume
      const response = await fetch(`/api/resumes/${resumeId}/job-description`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.jobDescription) {
          setJobDesc(data.jobDescription);
          // Also update localStorage for consistency
          localStorage.setItem('lastJobDescription', data.jobDescription);
          return;
        }
      }
      
      // If no job description found in the API, fall back to localStorage
      const savedJobDesc = localStorage.getItem('lastJobDescription');
      if (savedJobDesc) {
        setJobDesc(savedJobDesc);
      }
    } catch (error) {
      console.error("Error fetching job description:", error);
    } finally {
      setIsFetchingJobDesc(false);
    }
  };
  
  // Reset job description
  const resetJobDescription = async () => {
    try {
      setIsResetting(true);
      // Clear from state and localStorage
      setJobDesc("");
      localStorage.removeItem('lastJobDescription');
      
      // Also delete from the database if we have a resumeId
      if (resumeId) {
        const response = await fetch(`/api/resumes/${resumeId}/job-description`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error("Failed to delete job description from database:", await response.text());
          toast.error("Failed to remove job description from database");
          return;
        }
      }
      
      toast.success("Job description reset");
    } catch (error) {
      console.error("Error resetting job description:", error);
      toast.error("Failed to reset job description");
    } finally {
      setIsResetting(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchJobDescription();
    }
  }, [isOpen, resumeId]);

  const handleGenerateHRMessage = async () => {
    if (!jobDesc.trim()) {
      toast.error("Please provide a job description");
      return;
    }
    
    if (!recruiterName.trim()) {
      toast.error("Please provide the recruiter's name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const generatedHRMessage = await generateHRMessage(
        resumeId,
        jobDesc,
        recruiterName,
        additionalInfo
      );
      
      setHRMessage(generatedHRMessage);
      toast.success("HR message generated successfully");
    } catch (error) {
      console.error("Error generating HR message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate HR message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (hrMessage) {
      navigator.clipboard.writeText(hrMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("HR message copied to clipboard");
    }
  };

  const handleDialogChange = (open: boolean) => {
    // If trying to close with unsaved content
    if (!open && hrMessage && editorRef.current?.value !== hrMessage && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setIsOpen(open);
    if (!open) {
      // Reset state when closing and clear localStorage to avoid reusing old job descriptions
      setHRMessage("");
      setRecruiterName("");
      setAdditionalInfo("");
      // We clear localStorage when closing to ensure a fresh start next time
      localStorage.removeItem('lastJobDescription');
    }
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    setIsOpen(false);
    setHRMessage("");
    setRecruiterName("");
    setAdditionalInfo("");
    // Clear localStorage to avoid reusing old job descriptions
    localStorage.removeItem('lastJobDescription');
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    disabled={!canUseAIGeneration()}
                  >
                    <MessageCircle size={16} />
                    <span>Generate HR Message</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>HR Message Generator</DialogTitle>
                    <DialogDescription>
                      Generate a personalized message to a recruiter based on your resume and the job description
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    <div className="space-y-4 overflow-y-auto p-1">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="recruiterName" className="text-sm font-medium">
                            Recruiter Full Name
                          </label>
                        </div>
                        <Input
                          id="recruiterName"
                          placeholder="Enter the recruiter's full name..."
                          value={recruiterName}
                          onChange={(e) => setRecruiterName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="jobDescription" className="text-sm font-medium">
                            Job Description
                          </label>
                          {jobDesc && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={resetJobDescription}
                              className="h-7 px-2 text-xs"
                              disabled={isLoading || isResetting}
                            >
                              {isResetting ? (
                                <>
                                  <Loader size={14} className="mr-1 animate-spin" />
                                  Resetting...
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={14} className="mr-1" />
                                  Reset
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <Textarea
                          id="jobDescription"
                          placeholder="Paste the job description here..."
                          className="h-40 resize-none"
                          value={jobDesc}
                          onChange={(e) => setJobDesc(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="additionalInfo" className="text-sm font-medium">
                          Additional Information (Optional)
                        </label>
                        <Textarea
                          id="additionalInfo"
                          placeholder="Add any additional information or specific requests for your message..."
                          className="h-32 resize-none"
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleGenerateHRMessage} 
                        disabled={isLoading || !jobDesc.trim() || !recruiterName.trim()}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader size={16} className="mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <MessageCircle size={16} className="mr-2" />
                            Generate HR Message
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden flex flex-col">
                      <div className="p-2 bg-muted flex justify-between items-center border-b">
                        <span className="text-sm font-medium">HR Message</span>
                        {hrMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 px-2"
                          >
                            {copied ? (
                              <Check size={16} className="mr-1 text-green-500" />
                            ) : (
                              <Copy size={16} className="mr-1" />
                            )}
                            {copied ? "Copied" : "Copy"}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        ref={editorRef}
                        placeholder="Your generated HR message will appear here..."
                        className="flex-grow h-full resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={hrMessage}
                        onChange={(e) => setHRMessage(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </span>
          </TooltipTrigger>
          {!canUseAIGeneration() && (
            <TooltipContent className="max-w-xs p-3">
              <p>You've reached your free AI generations limit. <Link href="/dashboard" className="text-primary underline">Upgrade to premium</Link> for unlimited AI features.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your HR message. Are you sure you want to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Close anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 