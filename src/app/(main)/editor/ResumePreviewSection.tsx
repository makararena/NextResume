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
  const [isReady, setIsReady] = useState(false);
  const [containerHeight, setContainerHeight] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate available height for the container
  useEffect(() => {
    const calculateHeight = () => {
      // Get viewport height and subtract header/footer + margins
      const viewportHeight = window.innerHeight;
      const topOffset = containerRef.current?.getBoundingClientRect().top || 0;
      const bottomMargin = 80; // Space for footer and bottom margins
      
      // Calculate available height
      const availableHeight = viewportHeight - topOffset - bottomMargin;
      setContainerHeight(Math.max(500, availableHeight)); // Minimum 500px height
    };
    
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);
  
  useEffect(() => {
    setIsReady(true);
  }, []);

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
              <ResumePreview
                resumeData={resumeData}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
