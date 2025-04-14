import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useDebounce from "@/hooks/useDebounce";
import { fileReplacer } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { saveResume } from "./actions";
import isEqual from "lodash/isEqual";

export default function useAutoSaveResume(resumeData: ResumeValues) {
  console.log("🔄 useAutoSaveResume hook initialized");
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Track if this is first render to avoid unnecessary saves on mount
  const isFirstRender = useRef(true);
  
  // Track previous resume data to avoid unnecessary debounces
  const prevResumeDataRef = useRef<ResumeValues | null>(null);
  
  // Only debounce if data has actually changed
  const debouncedResumeData = useDebounce(
    useMemo(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return resumeData;
      }
      
      if (prevResumeDataRef.current && 
          JSON.stringify(prevResumeDataRef.current) === JSON.stringify(resumeData)) {
        console.log("🔄 Resume data unchanged, reusing previous data for debounce");
        return prevResumeDataRef.current;
      }
      
      console.log("🔄 Resume data changed, updating debounce input");
      prevResumeDataRef.current = resumeData;
      return resumeData;
    }, [resumeData]),
    1500
  );

  const [resumeId, setResumeId] = useState(resumeData.id);

  const [lastSavedData, setLastSavedData] = useState(
    structuredClone(resumeData),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsError(false);
  }, [debouncedResumeData]);

  useEffect(() => {
    // Skip effect on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    async function save() {
      try {
        console.time("⏱️ Auto-saving resume");
        console.log("🔄 Starting auto-save process");
        setIsSaving(true);
        setIsError(false);

        const newData = structuredClone(debouncedResumeData);
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
        setLastSavedData(newData);

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
      }
    }

    console.log(
      "🔍 Checking if save is needed - debouncedResumeData vs lastSavedData",
    );
    
    // Measure object sizes to see if there's any huge data
    console.log("📊 Data size - debouncedResumeData length:", 
      JSON.stringify(debouncedResumeData, fileReplacer).length);
    console.log("📊 Data size - lastSavedData length:", 
      JSON.stringify(lastSavedData, fileReplacer).length);

    // More reliable deep comparison using lodash isEqual
    const hasUnsavedChanges = !isEqual(
      JSON.parse(JSON.stringify(debouncedResumeData, fileReplacer)),
      JSON.parse(JSON.stringify(lastSavedData, fileReplacer))
    );

    console.log("🔄 hasUnsavedChanges:", hasUnsavedChanges, "isSaving:", isSaving, "isError:", isError);

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

  // Use memo to prevent unnecessary recalculations of hasUnsavedChanges
  const result = useMemo(() => ({
    isSaving,
    hasUnsavedChanges:
      JSON.stringify(resumeData, fileReplacer) !== JSON.stringify(lastSavedData, fileReplacer),
  }), [isSaving, resumeData, lastSavedData]);
  
  return result;
}
