"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileUp,
  Linkedin,
  Clipboard,
  UserCircle,
  ArrowRight,
} from "lucide-react";

type Step = {
  id: number;
  title: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  color: string;
};

export function AIModeInstructionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeStep, setActiveStep] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      id: 1,
      title: "Upload Your CV",
      description:
        "Upload your existing resume in PDF format. Our system will extract your work history, skills, and education.",
      tips: [
        "Make sure your PDF is not password protected",
        "Ensure your resume has clear headings for experience, skills, and education",
        "The AI performs best with cleanly formatted documents",
      ],
      icon: <FileUp className="h-16 w-16 text-primary" />,
      color: "bg-blue-500 text-white",
    },
    {
      id: 2,
      title: "Add Job Description",
      description:
        "Copy and paste the job description from LinkedIn or other job sites. This helps AI understand the job requirements.",
      tips: [
        "Include the complete job description, not just the title",
        "The more detailed the job description, the better the AI results",
        "Copy requirements, responsibilities, and qualifications sections",
      ],
      icon: <Linkedin className="h-16 w-16 text-primary" />,
      color: "bg-indigo-500 text-white",
    },
    {
      id: 3,
      title: "AI Analysis",
      description:
        "Our AI analyzes both your resume and the job description to identify matching skills and experience to highlight.",
      tips: [
        "The AI highlights keywords from the job description found in your resume",
        "It prioritizes skills and experience that match what employers seek",
        "The analysis typically takes less than 10 seconds to complete",
      ],
      icon: <Clipboard className="h-16 w-16 text-primary" />,
      color: "bg-purple-500 text-white",
    },
    {
      id: 4,
      title: "Additional Details",
      description:
        "Optionally, add a professional photo or any additional information you want to include in your resume.",
      tips: [
        "A professional headshot can enhance certain types of resumes",
        "Include additional achievements or skills not found in your original resume",
        "You'll be able to edit everything in the final resume",
      ],
      icon: <UserCircle className="h-16 w-16 text-primary" />,
      color: "bg-green-500 text-white",
    },
  ];

  // Extract scroll handler so we can call it on open and on scroll
  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Improved algorithm to better determine which step is visible
    // Get step height
    const stepHeight = scrollHeight / steps.length;
    
    // Calculate which step is most visible in the viewport
    // Add half a step height to make the detection more centered on the visible content
    const currentStepIndex = Math.min(
      Math.floor((scrollTop + (stepHeight / 2)) / stepHeight),
      steps.length - 1
    );
    
    setActiveStep(currentStepIndex + 1);
  }, [steps.length]);

  // When dialog opens, reset scroll and recalc step
  React.useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "auto" });
      handleScroll();
    }
  }, [open, handleScroll]);

  // Attach scroll listener
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Wrap the parent's onOpenChange to reset on close
  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // reset state + scroll on close
      setActiveStep(1);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "auto" });
      }
    }
    onOpenChange(isOpen);
  };

  // Click on steps to scroll programmatically
  const scrollToStep = (stepId: number) => {
    const container = containerRef.current;
    if (!container) return;
    const stepHeight = container.scrollHeight / steps.length;
    container.scrollTo({
      top: stepHeight * (stepId - 1),
      behavior: "smooth",
    });
    setActiveStep(stepId);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl text-center">
            How to Create Your AI Resume
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            Follow these 4 steps to optimize your resume for specific job
            descriptions
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-between mb-4 px-2 border-b pb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => scrollToStep(step.id)}
            >
              <div
                className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 shadow-sm",
                  activeStep >= step.id
                    ? step.color
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                )}
              >
                {step.id}
              </div>
              <div
                className={cn(
                  "text-xs mt-2 transition-colors duration-300 text-center",
                  activeStep >= step.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable content */}
        <div
          ref={containerRef}
          className="overflow-y-auto pr-2 flex-1 snap-y snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
          style={{ msOverflowStyle: "none" }}
        >
          {steps.map((step) => (
            <div
              key={step.id}
              className="py-8 px-4 snap-start min-h-[320px] flex flex-col items-center"
            >
              <div
                className={cn(
                  "p-6 rounded-full mb-6",
                  step.id === 1
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : step.id === 2
                    ? "bg-indigo-100 dark:bg-indigo-900/20"
                    : step.id === 3
                    ? "bg-purple-100 dark:bg-purple-900/20"
                    : "bg-green-100 dark:bg-green-900/20"
                )}
              >
                {step.icon}
              </div>
              <h3 className="text-xl font-medium mb-4 text-center">
                {step.title}
              </h3>
              <p className="text-base text-center mb-6">{step.description}</p>
              <div className="w-full bg-muted/30 rounded-lg p-4 mt-2">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Tips:
                </h4>
                <ul className="text-sm space-y-2">
                  {step.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block h-4 w-4 text-xs font-medium rounded-full bg-primary/20 text-primary flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                        •
                      </span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button
            onClick={() => handleDialogOpenChange(false)}
            className="w-full py-6 text-lg font-medium"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
