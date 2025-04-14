import ResumePreview from "@/components/ResumePreview";
import { cn } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import ColorPicker from "./ColorPicker";
import { useRef, useState, useEffect } from "react";

interface ResumePreviewSectionProps {
  resumeData: ResumeValues;
  setResumeData: (data: ResumeValues) => void;
  className?: string;
  showFormattingControls?: boolean;
}

// A4 aspect ratio (width:height = 1:1.414)
const A4_ASPECT_RATIO = 1.414;

export default function ResumePreviewSection({
  resumeData,
  setResumeData,
  className,
  showFormattingControls = false,
}: ResumePreviewSectionProps) {
  console.log("⚡ ResumePreviewSection rendering");
  console.time("⏱️ ResumePreviewSection render time");
  
  const [isReady, setIsReady] = useState(false);
  const [containerHeight, setContainerHeight] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate available height for the container
  useEffect(() => {
    console.log("⚡ ResumePreviewSection height calculation effect running");
    console.time("⏱️ Height calculation");
    
    const calculateHeight = () => {
      // Get viewport height and subtract header/footer + margins
      const viewportHeight = window.innerHeight;
      const topOffset = containerRef.current?.getBoundingClientRect().top || 0;
      const bottomMargin = 80; // Space for footer and bottom margins
      
      // Calculate available height
      const availableHeight = viewportHeight - topOffset - bottomMargin;
      setContainerHeight(Math.max(500, availableHeight)); // Minimum 500px height
      console.log("📏 Container height calculated:", Math.max(500, availableHeight));
    };
    
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    console.timeEnd("⏱️ Height calculation");
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);
  
  useEffect(() => {
    console.log("⚡ Setting isReady to true");
    setIsReady(true);
  }, []);

  // Log data size as this might be causing performance issues
  useEffect(() => {
    console.log("📊 Resume data size:", JSON.stringify(resumeData).length);
    if (resumeData.workExperiences) {
      console.log("📊 Work experiences count:", resumeData.workExperiences.length);
    }
    if (resumeData.educations) {
      console.log("📊 Education entries count:", resumeData.educations.length);
    }
  }, [resumeData]);

  console.timeEnd("⏱️ ResumePreviewSection render time");

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
    >
      {!showFormattingControls && (
        <div className="absolute right-3 top-3 flex flex-col gap-3 z-10 print:hidden">
          <ColorPicker
            color={resumeData.colorHex}
            onChange={(color) =>
              setResumeData({ ...resumeData, colorHex: color.hex })
            }
          />
        </div>
      )}
      <div 
        className="flex w-full justify-center overflow-y-auto bg-muted rounded-lg p-4 print:h-auto print:overflow-visible print:bg-white print:p-0 print:rounded-none"
        style={{ height: `${containerHeight}px` }}
      >
        {isReady && (
          <div className="resume-preview-container w-full max-w-3xl flex justify-center items-start overflow-visible print:max-w-none print:shadow-none print:w-full print:h-full print:scale-100">
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}>
              {console.time("⏱️ ResumePreview component render")}
              <ResumePreview
                resumeData={resumeData}
                className="w-full"
              />
              {console.timeEnd("⏱️ ResumePreview component render")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
