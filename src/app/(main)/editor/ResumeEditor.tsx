"use client";

import useUnloadWarning from "@/hooks/useUnloadWarning";
import { ResumeServerData } from "@/lib/types";
import { cn, mapToResumeValues } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import ResumePreviewSection from "./ResumePreviewSection";
import { steps } from "./steps";
import useAutoSaveResume from "./useAutoSaveResume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FileText, Printer, Layout, Save, Check, Loader } from "lucide-react";
import Link from "next/link";
import ColorPicker from "./ColorPicker";
import CoverLetterGenerator from "./CoverLetterGenerator";
import HRMessageGenerator from "./HRMessageGenerator";

interface ResumeEditorProps {
  resumeToEdit: ResumeServerData | null;
}

export default function ResumeEditor({ resumeToEdit }: ResumeEditorProps) {
  const searchParams = useSearchParams();

  const [resumeData, setResumeData] = useState<ResumeValues>(
    resumeToEdit ? mapToResumeValues(resumeToEdit) : {},
  );

  // Add photoUrl to resumeData if it exists in resumeToEdit
  useEffect(() => {
    if (resumeToEdit && resumeToEdit.photoUrl && !resumeData.photoUrl) {
      setResumeData(prevData => ({
        ...prevData,
        photoUrl: resumeToEdit.photoUrl
      }));
    }
  }, [resumeToEdit, resumeData.photoUrl]);

  const [showSmResumePreview, setShowSmResumePreview] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(resumeData.template || "classic");

  const { isSaving, hasUnsavedChanges } = useAutoSaveResume(resumeData);

  useUnloadWarning(hasUnsavedChanges);

  const currentStep = searchParams.get("step") || steps[0].key;

  function setStep(key: string) {
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
    setActiveTemplate(templateId);
    setResumeData({ ...resumeData, template: templateId });
  };

  const handlePrint = () => {
    // Find the resume content - get the inner content, not the container
    const container = document.querySelector('.resume-preview-container');
    if (!container) {
      console.error('Could not find resume content container');
      return;
    }
    
    // Get the actual resume content
    const content = container.querySelector('div > div > div');
    if (!content) {
      console.error('Could not find resume content element');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print your resume.');
      return;
    }
    
    // Get all stylesheets from the current document
    const styleSheets = Array.from(document.styleSheets);
    let styles = '';
    
    try {
      // Extract styles from all stylesheets
      styleSheets.forEach(sheet => {
        try {
          const cssRules = sheet.cssRules || sheet.rules;
          if (cssRules) {
            for (let i = 0; i < cssRules.length; i++) {
              styles += cssRules[i].cssText;
            }
          }
        } catch (e) {
          console.warn('Cannot access stylesheet rules', e);
        }
      });
    } catch (e) {
      console.error('Error accessing stylesheets:', e);
    }
    
    // Create a clean copy of the content for printing
    const contentClone = content.cloneNode(true) as HTMLElement;
    
    // Add A4 styling and paper size
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resume - ${resumeData.firstName || ''} ${resumeData.lastName || ''}</title>
          <style>
            ${styles}
            
            @page {
              size: A4;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              background-color: white !important;
              color: black !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .print-container {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              background-color: white;
              box-shadow: none;
              overflow: hidden;
              page-break-after: always;
              position: relative;
            }
            
            /* Fix display of elements */
            .sm\\:inline {
              display: inline !important;
            }
            
            .hidden {
              display: none !important;
            }
            
            /* Fix text sizing */
            .text-sm {
              font-size: 0.875rem !important;
              line-height: 1.25rem !important;
            }
            
            .text-xs {
              font-size: 0.75rem !important;
              line-height: 1rem !important;
            }
            
            /* Grid layout fixes for Modern template */
            .grid {
              display: grid !important;
            }
            
            .grid-cols-3 {
              grid-template-columns: 1fr 1fr 1fr !important;
            }
            
            .col-span-1 {
              grid-column: span 1 / span 1 !important;
            }
            
            .col-span-2 {
              grid-column: span 2 / span 2 !important;
            }
            
            /* Enforce A4 size and prevent overflow */
            .print-container > div {
              width: 100% !important;
              height: 100% !important;
              max-height: 297mm !important;
              overflow: hidden !important;
            }
            
            /* Remove any transforms/scaling */
            * {
              transform: none !important;
              zoom: 1 !important;
              scale: 1 !important;
              box-sizing: border-box !important;
              max-width: 100% !important;
            }
            
            /* Special handling for word breaks */
            .break-words {
              word-break: break-word !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${contentClone.outerHTML}
          </div>
          <script>
            // Ensure fonts are loaded before printing
            document.fonts.ready.then(() => {
              // Use a delay to make sure everything renders properly
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
  };

  return (
    <div className="flex grow flex-col min-h-screen bg-background">
      {/* Fixed header with navigation and template buttons */}
      <div className="bg-card border-b border-border px-3 py-3 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          {/* Navigation steps */}
          <div className="overflow-x-auto no-scrollbar flex-1">
            <Breadcrumbs currentStep={currentStep} setCurrentStep={setStep} />
          </div>
          
          {/* Template selector buttons */}
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

      <main className="flex-1 p-3 md:p-6 print:p-0">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
            <div className="w-full space-y-6 bg-card border border-border rounded-lg shadow-sm p-6 print:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Resume Editor</h2>
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
            </div>

            <div className={cn(
              "w-full bg-card border border-border rounded-lg shadow-sm p-6 print:shadow-none print:border-none print:p-0",
              showSmResumePreview ? "block" : "hidden lg:block"
            )}>
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h2 className="text-lg font-medium">Preview</h2>
                <div className="flex items-center gap-2">
                  <HRMessageGenerator 
                    resumeId={resumeToEdit?.id || ""}
                  />
                  <CoverLetterGenerator 
                    resumeId={resumeToEdit?.id || ""}
                  />
                  <ColorPicker
                    color={resumeData.colorHex}
                    onChange={(color) =>
                      setResumeData({ ...resumeData, colorHex: color.hex })
                    }
                  />
                  <Button variant="outline" size="icon" onClick={handlePrint} title="Print Resume">
                    <Printer className="size-5" />
                  </Button>
                </div>
              </div>
              <ResumePreviewSection
                resumeData={{...resumeData, template: activeTemplate}}
                setResumeData={setResumeData}
                showFormattingControls={true}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer
        currentStep={currentStep}
        setCurrentStep={setStep}
        showSmResumePreview={showSmResumePreview}
        setShowSmResumePreview={setShowSmResumePreview}
        isSaving={isSaving}
        className="print:hidden"
      />
    </div>
  );
}
