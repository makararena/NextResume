"use client";

import useUnloadWarning from "@/hooks/useUnloadWarning";
import { ResumeServerData } from "@/lib/types";
import { cn, mapToResumeValues, logMemoryUsage } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "./Breadcrumbs";
import ResumePreviewSection from "./ResumePreviewSection";
import { steps } from "./steps";
import useAutoSaveResume from "./useAutoSaveResume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FileText, Printer, Layout, Save, Check, Loader, ChevronRight, PenLineIcon } from "lucide-react";
import Link from "next/link";
import ColorPicker from "./ColorPicker";
import CoverLetterGenerator from "./CoverLetterGenerator";
import HRMessageGenerator from "./HRMessageGenerator";

interface ResumeEditorProps {
  resumeToEdit: ResumeServerData | null;
}

export default function ResumeEditor({ resumeToEdit }: ResumeEditorProps) {
  console.time("⏱️ ResumeEditor render time");
  console.log("🚀 Rendering ResumeEditor with resumeToEdit:", { id: resumeToEdit?.id, title: resumeToEdit?.title });
  logMemoryUsage("ResumeEditor-start");

  const searchParams = useSearchParams();

  console.log("📄 ResumeEditor rendered");
  console.log("➡️ resumeToEdit:", resumeToEdit);

  // Initial state
  const [resumeData, setResumeDataRaw] = useState<ResumeValues>(() => {
    console.time("⏱️ Initial state creation");
    const initial = resumeToEdit ? mapToResumeValues(resumeToEdit) : {};
    console.log("🆕 Initial resumeData state:", initial);
    console.timeEnd("⏱️ Initial state creation");
    return initial;
  });

  const setResumeData = (updater: ResumeValues | ((prev: ResumeValues) => ResumeValues)) => {
    console.log("🛠️ setResumeData called");
    logMemoryUsage("before-setResumeData");
    setResumeDataRaw((prevData) => {
      const nextData = typeof updater === "function" ? updater(prevData) : updater;
      console.log("📝 Previous resumeData:", prevData);
      console.log("📝 Next resumeData:", nextData);
      
      // Check if the data has actually changed before updating state
      if (JSON.stringify(prevData) === JSON.stringify(nextData)) {
        console.log("🔄 No changes detected in resumeData, skipping update");
        return prevData;
      }
      
      return nextData;
    });
    logMemoryUsage("after-setResumeData");
  };

  const stableResumeData = useMemo(() => {
    console.log("🧩 Calculating stableResumeData");
    logMemoryUsage("before-stableResumeData");
    const result = resumeData;
    logMemoryUsage("after-stableResumeData");
    return result;
  }, [resumeData]);

  const { isSaving, hasUnsavedChanges } = useAutoSaveResume(stableResumeData);

  console.log("💾 Auto-save hook status:", { isSaving, hasUnsavedChanges });

  useUnloadWarning(hasUnsavedChanges);

  useEffect(() => {
    console.log("✅ resumeData changed");
    logMemoryUsage("after-resumeData-change");
  }, [resumeData]);

  useEffect(() => {
    console.log("✅ stableResumeData for auto-save:", stableResumeData);
    logMemoryUsage("after-stableResumeData-change");
  }, [stableResumeData]);

  const [showSmResumePreview, setShowSmResumePreview] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(resumeData.template || "classic");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Preparing your resume...");

  useEffect(() => {
    console.log("🎨 Active template:", activeTemplate);
  }, [activeTemplate]);

  useEffect(() => {
    if (resumeToEdit && resumeToEdit.photoUrl && !resumeData.photoUrl) {
      console.log("🖼️ Adding photoUrl from resumeToEdit:", resumeToEdit.photoUrl);
      setResumeData(prevData => ({
        ...prevData,
        photoUrl: resumeToEdit.photoUrl || undefined
      }));
    }
  }, [resumeToEdit, resumeData.photoUrl]);

  // Page loading effect
  useEffect(() => {
    // Show loading state initially
    setIsLoading(true);
    setLoadingMessage("Preparing your resume...");
    
    // Hide loading state after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const currentStep = searchParams.get("step") || steps[0].key;
  console.log("🚶‍♂️ Current step:", currentStep);

  function setStep(key: string) {
    console.log("🔄 Step changed:", key);
    // Show loading animation when changing steps
    setIsLoading(true);
    setLoadingMessage("Updating your resume...");
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("step", key);
    window.history.pushState(null, "", `?${newSearchParams.toString()}`);
    
    // Hide loading after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 400); // Shorter delay for step changes
  }

  const FormComponent = steps.find(
    (step) => step.key === currentStep,
  )?.component;

  const templates = [
    { id: "classic", name: "Classic", icon: <Layout className="h-4 w-4" /> },
    { id: "modern", name: "Modern", icon: <Layout className="h-4 w-4" /> },
    { id: "minimalist", name: "Minimalist", icon: <Layout className="h-4 w-4" /> }
  ];

  // Add loading when template changes
  const handleTemplateChange = (templateId: string) => {
    console.log("🎨 Template changed to:", templateId);
    setIsLoading(true); // Show loading animation
    setLoadingMessage("Applying template...");
    setActiveTemplate(templateId);
    setResumeData(prevData => ({ ...prevData, template: templateId }));
    
    // Hide loading after template change is processed
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Enhanced loading management for AI dialogs
  useEffect(() => {
    // Add event listeners for dialog openings
    const handleDialogOpen = () => {
      setIsLoading(true);
      setLoadingMessage("Preparing AI assistant...");
      // Hide loading after a reasonable delay
      setTimeout(() => setIsLoading(false), 800);
    };
    
    // Listen for dialog open events from AI components
    document.addEventListener('ai-dialog-open', handleDialogOpen);
    
    // Clean up
    return () => {
      document.removeEventListener('ai-dialog-open', handleDialogOpen);
    };
  }, []);

  // Enhance handlePrint with loading animation
  const handlePrint = () => {
    console.log("🖨️ Print triggered");
    setIsLoading(true); // Show loading animation
    setLoadingMessage("Preparing to print...");
    logMemoryUsage("before-print");
    
    const container = document.querySelector('.resume-preview-container');
    if (!container) {
      console.error('❌ Could not find resume content container');
      setIsLoading(false);
      return;
    }

    // Get the actual resume content directly
    const resumePreview = container.querySelector('.bg-white');
    if (!resumePreview) {
      console.error('❌ Could not find resume preview element');
      setIsLoading(false);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print your resume.');
      setIsLoading(false);
      return;
    }

    // Create a clone of the resume content for printing
    const contentClone = resumePreview.cloneNode(true) as HTMLElement;
    
    // Reset any transforms or scales that might be applied
    contentClone.style.transform = 'none';
    contentClone.style.scale = '1';
    contentClone.style.width = '210mm';
    contentClone.style.height = '297mm';
    contentClone.style.margin = '0';
    contentClone.style.padding = '0';
    contentClone.style.overflow = 'hidden';

    // Get styles for printing
    const styleSheets = Array.from(document.styleSheets);
    let styles = '';

    try {
      styleSheets.forEach(sheet => {
        try {
          const cssRules = sheet.cssRules || sheet.rules;
          if (cssRules) {
            for (let i = 0; i < cssRules.length; i++) {
              styles += cssRules[i].cssText;
            }
          }
        } catch (e) {
          console.warn('⚠️ Cannot access stylesheet rules', e);
        }
      });
    } catch (e) {
      console.error('❌ Error accessing stylesheets:', e);
    }

    // Add specific print styles for A4 format with no padding or margins
    const printStyles = `
      @page {
        size: A4;
        margin: 0;
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: white;
        overflow: hidden;
      }
      .print-container {
        width: 210mm;
        height: 297mm;
        margin: 0 auto;
        padding: 0;
        overflow: hidden;
        page-break-after: avoid;
        page-break-before: avoid;
        page-break-inside: avoid;
        position: relative;
        box-sizing: border-box;
      }
      .print-container > div {
        transform: none !important;
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        box-sizing: border-box;
        overflow: hidden;
        margin: 0;
        padding: 0;
        background-color: white;
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resume - ${resumeData.firstName || ''} ${resumeData.lastName || ''}</title>
          <style>${styles}</style>
          <style>${printStyles}</style>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div class="print-container">${contentClone.outerHTML}</div>
          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 100);
              }, 500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Reset loading state after print dialog is shown
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    logMemoryUsage("after-print");
  };

  console.timeEnd("⏱️ ResumeEditor render time");
  logMemoryUsage("ResumeEditor-end");

  // Find previous and next steps for navigation
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  const previousStep = currentStepIndex > 0 ? steps[currentStepIndex - 1].key : undefined;
  const nextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1].key : undefined;
  
  // Calculate progress percentage for progress bar
  const progressPercentage = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="flex grow flex-col min-h-screen bg-background">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Layout className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-muted-foreground animate-pulse">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      <div className="bg-card border-b border-border px-3 py-3 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-screen-xl mx-auto">
          {/* Top navigation row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-muted-foreground opacity-0 ml-2 flex items-center gap-1.5",
                  isSaving ? "opacity-100" : hasUnsavedChanges ? "opacity-100" : "",
                )}
              >
                {isSaving && (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs sm:text-sm">Saving...</span>
                  </>
                )}
                {!isSaving && hasUnsavedChanges && (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-600">All changes saved</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* We've moved the Preview button below the step indicator for all screen sizes */}
            </div>
          </div>
          
          {/* Progress bar and step indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs sm:text-sm font-medium">Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}</p>
              <span className="text-xs sm:text-sm text-muted-foreground">{progressPercentage}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            {/* Back button and Template selector under progress bar */}
            <div className="mt-3 flex items-center justify-between">
              {/* Back button */}
              <Button 
                className="bg-muted text-muted-foreground hover:bg-muted/70 border border-border"
                variant="outline"
                size="sm" 
                asChild
              >
                <Link href="/resumes">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Link>
              </Button>
              
              <div className="flex items-center gap-2">
                {/* Choose Template button - only visible on mobile */}
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden border border-border bg-muted text-muted-foreground hover:bg-muted/70"
                  onClick={() => {
                    // Create a fullscreen modal for mobile template selection
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-background z-50 flex flex-col overflow-hidden';
                    modal.innerHTML = `
                      <div class="bg-card p-4 border-b border-border">
                        <div class="flex justify-between items-center">
                          <h3 class="font-medium">Choose Template</h3>
                          <button class="text-muted-foreground text-lg">&times;</button>
                        </div>
                      </div>
                      <div class="flex-1 overflow-auto p-4">
                        ${templates.map(template => `
                          <button class="w-full text-left p-4 mb-2 rounded-md flex items-center ${
                            activeTemplate === template.id 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'hover:bg-muted border border-border'
                          }">
                            <span class="mr-3">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M3 9h18" />
                                <path d="M9 21V9" />
                              </svg>
                            </span>
                            <span class="text-base">${template.name}</span>
                            ${activeTemplate === template.id ? '<span class="ml-auto text-primary">✓</span>' : ''}
                          </button>
                        `).join('')}
                      </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    // Set up event listeners
                    const closeBtn = modal.querySelector('div > div > button');
                    closeBtn?.addEventListener('click', () => {
                      document.body.removeChild(modal);
                    });
                    
                    // Template selection buttons
                    const templateBtns = modal.querySelectorAll('div:nth-child(2) > button');
                    templateBtns.forEach((btn, index) => {
                      btn.addEventListener('click', () => {
                        handleTemplateChange(templates[index].id);
                        document.body.removeChild(modal);
                      });
                    });
                  }}
                >
                  <Layout className="mr-1.5 h-4 w-4" />
                  Templates
                </Button>

                {/* Preview button - only visible on mobile */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSmResumePreview(!showSmResumePreview)}
                  className="text-xs border border-border bg-muted text-muted-foreground hover:bg-muted/70 md:hidden"
                >
                  {showSmResumePreview ? "Edit" : "Preview"}
                  {showSmResumePreview ? <PenLineIcon className="ml-1.5 h-4 w-4" /> : <FileText className="ml-1.5 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile navigation and template selection */}
          {/* We've moved the mobile navigation functionality to the top nav area */}
          
          {/* Steps navigation with template buttons aligned */}
          <div className="overflow-x-auto no-scrollbar pb-1 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = step.key === currentStep;
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground flex-shrink-0" />
                      )}
                      <button
                        onClick={() => setStep(step.key)}
                        disabled={index > currentStepIndex}
                        className={cn(
                          "px-2 py-1 rounded-md text-xs sm:text-sm transition-colors flex items-center whitespace-nowrap",
                          isCurrent && "bg-primary text-primary-foreground font-medium",
                          isCompleted && "text-muted-foreground hover:bg-muted hover:text-foreground",
                          !isCompleted && !isCurrent && "text-muted-foreground/50 cursor-not-allowed"
                        )}
                      >
                        {isCompleted && (
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                        )}
                        {step.title}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* Template selection buttons - aligned with steps */}
              <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`flex items-center px-2.5 py-1.5 rounded text-xs sm:text-sm ${
                      activeTemplate === template.id 
                        ? "bg-card shadow-sm font-medium" 
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {template.icon}
                    <span className="ml-1.5">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Template selection buttons - only visible on desktop */}
          <div className="mt-3 hidden md:flex justify-end">
            {/* We've moved the template buttons to the top navigation bar */}
          </div>
        </div>
      </div>

      <main className="flex-1 p-3 md:p-6 print:p-0">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
            <div className={cn(
              "w-full bg-card border border-border rounded-lg shadow-sm print:hidden",
              showSmResumePreview ? "hidden md:block" : "block"
            )}>
              {/* Single container with flex column layout */}
              <div className="flex flex-col h-[calc(100vh-12rem)]">

                {/* Fixed header with title and badge */}
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold">{steps[currentStepIndex]?.title}</h2>
                    <Badge variant="outline" className="text-xs text-muted-foreground bg-muted">
                      {activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)} Template
                    </Badge>
                  </div>
                </div>

                {/* Scrollable Form - Only this section scrolls */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 sm:pt-5">
                  <div className="space-y-6 pb-4">
                    {FormComponent && (
                      <FormComponent
                        resumeData={resumeData}
                        setResumeData={setResumeData}
                      />
                    )}
                  </div>
                </div>

                {/* Fixed footer for navigation - with improved visual separation */}
                <div className="border-t border-border p-4 sm:p-5 bg-transparent backdrop-blur-sm">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousStep ? () => setStep(previousStep) : undefined}
                      disabled={!previousStep}
                      className={cn(
                        "px-3 sm:px-5",
                        !previousStep 
                          ? "bg-background/80 text-muted-foreground/60 border-muted hover:bg-background/80 hover:text-muted-foreground/60" 
                          : "bg-background text-foreground hover:bg-background/90 border-border"
                      )}
                    >
                      <ArrowLeft className="mr-1 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm">Previous</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={nextStep ? () => setStep(nextStep) : undefined}
                      disabled={!nextStep}
                      className={cn(
                        "px-3 sm:px-6",
                        !nextStep
                          ? "bg-primary/60 text-primary-foreground/90 hover:bg-primary/60"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <span className="text-xs sm:text-sm">Next</span>
                      <ArrowRight className="ml-1 sm:ml-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "w-full bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 print:shadow-none print:border-none print:p-0 lg:h-[calc(100vh-10rem)] lg:max-h-full lg:sticky lg:top-24 lg:overflow-auto",
              showSmResumePreview ? "block" : "hidden lg:block"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 print:hidden gap-3">
                <h2 className="text-lg font-medium">Resume Preview</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={handlePrint} 
                      title="Print Resume"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" />
                      Print
                    </Button>
                    
                    <ColorPicker
                      color={resumeData.colorHex}
                      onChange={(color) =>
                        setResumeData(prevData => ({
                          ...prevData,
                          colorHex: color.hex
                        }))
                      }
                      size="sm"
                    />
                  </div>
                  
                  <div className="inline-flex flex-wrap items-center gap-2">
                    {/* Enhanced AI components with custom events */}
                    <div 
                      onClick={() => {
                        // Show loading when clicking the HR Message button
                        setIsLoading(true);
                        // Create and dispatch a custom event when dialog opens
                        document.dispatchEvent(new CustomEvent('ai-dialog-open'));
                      }}
                    >
                      <HRMessageGenerator 
                        resumeId={resumeToEdit?.id || ""} 
                      />
                    </div>
                    <div 
                      onClick={() => {
                        // Show loading when clicking the Cover Letter button
                        setIsLoading(true);
                        // Create and dispatch a custom event when dialog opens
                        document.dispatchEvent(new CustomEvent('ai-dialog-open'));
                      }}
                    >
                      <CoverLetterGenerator 
                        resumeId={resumeToEdit?.id || ""} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <ResumePreviewSection
                resumeData={{ ...resumeData, template: activeTemplate }}
                setResumeData={setResumeData}
                showFormattingControls={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
