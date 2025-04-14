"use client";

import useUnloadWarning from "@/hooks/useUnloadWarning";
import { ResumeServerData } from "@/lib/types";
import { cn, mapToResumeValues, logMemoryUsage } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import ResumePreviewSection from "./ResumePreviewSection";
import { steps } from "./steps";
import useAutoSaveResume from "./useAutoSaveResume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FileText, Printer, Layout, Save, Check, Loader, ChevronRight } from "lucide-react";
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

  const currentStep = searchParams.get("step") || steps[0].key;
  console.log("🚶‍♂️ Current step:", currentStep);

  function setStep(key: string) {
    console.log("🔄 Step changed:", key);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("step", key);
    window.history.pushState(null, "", `?${newSearchParams.toString()}`);
  }

  const FormComponent = steps.find(
    (step) => step.key === currentStep,
  )?.component;

  const templates = [
    { id: "classic", name: "Classic", icon: <Layout className="h-4 w-4" /> },
    { id: "modern", name: "Modern", icon: <Layout className="h-4 w-4" /> },
    { id: "minimalist", name: "Minimalist", icon: <Layout className="h-4 w-4" /> }
  ];

  const handleTemplateChange = (templateId: string) => {
    console.log("🎨 Template changed to:", templateId);
    setActiveTemplate(templateId);
    setResumeData(prevData => ({ ...prevData, template: templateId }));
  };

  const handlePrint = () => {
    console.log("🖨️ Print triggered");
    logMemoryUsage("before-print");
    const container = document.querySelector('.resume-preview-container');
    if (!container) {
      console.error('❌ Could not find resume content container');
      return;
    }

    const content = container.querySelector('div > div > div');
    if (!content) {
      console.error('❌ Could not find resume content element');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print your resume.');
      return;
    }

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

    const contentClone = content.cloneNode(true) as HTMLElement;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resume - ${resumeData.firstName || ''} ${resumeData.lastName || ''}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">${contentClone.outerHTML}</div>
          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                    <span>Saving...</span>
                  </>
                )}
                {!isSaving && hasUnsavedChanges && (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">All changes saved</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {/* Progress bar and step indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium">Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}</p>
              <span className="text-sm text-muted-foreground">{progressPercentage}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Steps and templates row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-3 md:mr-4">
              <Button 
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                size="sm" 
                asChild
              >
                <Link href="/resumes">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto no-scrollbar flex-1">
              <div className="flex items-center space-x-1">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = step.key === currentStep;
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                      )}
                      <button
                        onClick={() => setStep(step.key)}
                        disabled={index > currentStepIndex}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center",
                          isCurrent && "bg-primary text-primary-foreground font-medium",
                          isCompleted && "text-muted-foreground hover:bg-muted hover:text-foreground",
                          !isCompleted && !isCurrent && "text-muted-foreground/50 cursor-not-allowed"
                        )}
                      >
                        {isCompleted && (
                          <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        )}
                        {step.title}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted p-1 rounded-md self-start md:self-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    activeTemplate === template.id 
                      ? "bg-card shadow-sm" 
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
      </div>

      <main className="flex-1 p-3 md:p-6 print:p-0">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
            <div className="w-full space-y-6 bg-card border border-border rounded-lg shadow-sm p-6 print:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{steps[currentStepIndex]?.title}</h2>
                <Badge variant="outline" className="text-muted-foreground bg-muted">
                  {activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)} Template
                </Badge>
              </div>
              {FormComponent && (
                <FormComponent
                  resumeData={resumeData}
                  setResumeData={setResumeData}
                />
              )}
               
              {/* Navigation buttons at the bottom of the form */}
              <div className="flex justify-between mt-8 pt-4 border-t border-border sticky bottom-0 bg-card p-4 -mx-6 -mb-6 rounded-b-lg">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={
                    previousStep ? () => setStep(previousStep) : undefined
                  }
                  disabled={!previousStep}
                  className="px-5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="lg"
                  onClick={nextStep ? () => setStep(nextStep) : undefined}
                  disabled={!nextStep}
                  className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className={cn(
              "w-full bg-card border border-border rounded-lg shadow-sm p-6 print:shadow-none print:border-none print:p-0",
              showSmResumePreview ? "block" : "hidden lg:block"
            )}>
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h2 className="text-lg font-medium">Preview</h2>
                <div className="flex items-center gap-2">
                  <HRMessageGenerator resumeId={resumeToEdit?.id || ""} />
                  <CoverLetterGenerator resumeId={resumeToEdit?.id || ""} />
                  <ColorPicker
                    color={resumeData.colorHex}
                    onChange={(color) =>
                      setResumeData(prevData => ({
                        ...prevData,
                        colorHex: color.hex
                      }))
                    }
                  />
                  <Button variant="outline" size="icon" onClick={handlePrint} title="Print Resume">
                    <Printer className="size-5" />
                  </Button>
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

      <Footer
        showSmResumePreview={showSmResumePreview}
        setShowSmResumePreview={setShowSmResumePreview}
        className="print:hidden"
      />
    </div>
  );
}
