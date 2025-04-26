import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useDebounce from "@/hooks/useDebounce";
import { fileReplacer } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { saveResume } from "./actions";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";

export default function useAutoSaveResume(resumeData: ResumeValues) {
  console.log("🔄 useAutoSaveResume hook initialized");
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Track if this is first render to avoid unnecessary saves on mount
  const isFirstRender = useRef(true);
  const saveInProgressRef = useRef(false);
  const activeElementBeforeSaveRef = useRef<Element | null>(null);
  
  // Use a more reliable debounce with increased delay for complex forms
  const debouncedResumeData = useDebounce(resumeData, 2000);

  const [resumeId, setResumeId] = useState(resumeData.id);
  const [lastSavedData, setLastSavedData] = useState<ResumeValues>(() => 
    cloneDeep(resumeData)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  // Reset error state when data changes
  useEffect(() => {
    setIsError(false);
  }, [debouncedResumeData]);

  // Main save logic
  useEffect(() => {
    // Skip the first render to avoid saving unchanged data on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Skip if already saving
    if (saveInProgressRef.current) {
      return;
    }
    
    async function save() {
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      
      // Store active element before saving
      activeElementBeforeSaveRef.current = document.activeElement;
      
      try {
        console.time("⏱️ Auto-saving resume");
        console.log("🔄 Starting auto-save process");
        setIsSaving(true);
        setIsError(false);

        const newData = cloneDeep(debouncedResumeData);
        
        // For work experience items, ensure descriptions are properly trimmed
        if (newData.workExperiences) {
          newData.workExperiences = newData.workExperiences.map(exp => ({
            ...exp,
            description: exp.description?.trim() || ""
          }));
        }

        console.log("📦 Preparing data for save");

        console.time("⏱️ saveResume server action");
        const updatedResume = await saveResume({
          ...newData,
          ...(JSON.stringify(lastSavedData.photo, fileReplacer) ===
            JSON.stringify(newData.photo, fileReplacer) && {
            photo: undefined,
          }),
          id: resumeId,
        });
        console.timeEnd("⏱️ saveResume server action");

        console.log("✅ Resume saved successfully, ID:", updatedResume.id);
        setResumeId(updatedResume.id);
        setLastSavedData(cloneDeep(newData));

        if (searchParams.get("resumeId") !== updatedResume.id) {
          console.log("🔄 Updating URL with new resumeId");
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("resumeId", updatedResume.id);
          window.history.replaceState(
            null,
            "",
            `?${newSearchParams.toString()}`,
          );
        }
        console.timeEnd("⏱️ Auto-saving resume");
      } catch (error) {
        console.timeEnd("⏱️ Auto-saving resume");
        console.error("❌ Error saving resume:", error);
        setIsError(true);
        const { dismiss } = toast({
          variant: "destructive",
          description: (
            <div className="space-y-3">
              <p>Could not save changes.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  dismiss();
                  saveInProgressRef.current = false;
                  save();
                }}
              >
                Retry
              </Button>
            </div>
          ),
        });
      } finally {
        setIsSaving(false);
        
        // Restore focus to the element that was active before saving
        setTimeout(() => {
          if (activeElementBeforeSaveRef.current instanceof HTMLElement) {
            try {
              activeElementBeforeSaveRef.current.focus();
            } catch (e) {
              console.warn("Could not restore focus after save:", e);
            }
          }
          
          // Allow another save after a short delay
          setTimeout(() => {
            saveInProgressRef.current = false;
          }, 500);
        }, 10);
      }
    }

    // Check if there are unsaved changes
    const hasUnsavedChanges = !isEqual(
      JSON.parse(JSON.stringify(debouncedResumeData, fileReplacer)),
      JSON.parse(JSON.stringify(lastSavedData, fileReplacer))
    );

    if (hasUnsavedChanges && debouncedResumeData && !isSaving && !isError) {
      console.log("🔄 Changes detected, triggering save");
      save();
    }
  }, [
    debouncedResumeData,
    isSaving,
    lastSavedData,
    isError,
    resumeId,
    searchParams,
    toast,
  ]);

  // Return a memoized result to avoid unnecessary renders
  return useMemo(() => ({
    isSaving,
    hasUnsavedChanges: !isEqual(
      JSON.parse(JSON.stringify(resumeData, fileReplacer)),
      JSON.parse(JSON.stringify(lastSavedData, fileReplacer))
    )
  }), [isSaving, resumeData, lastSavedData]);
}
