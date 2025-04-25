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
  const [scale, setScale] = useState(0.5);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate available height and determine if mobile
  useEffect(() => {
    console.log("⚡ ResumePreviewSection height calculation effect running");
    console.time("⏱️ Height calculation");
    
    const calculateDimensions = () => {
      // Check if mobile view
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Get viewport height and subtract header/footer + margins
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const topOffset = containerRef.current?.getBoundingClientRect().top || 0;
      const bottomMargin = isMobileView ? 80 : 40; // Reduced bottom margin for desktop
      
      // Calculate available height
      const availableHeight = viewportHeight - topOffset - bottomMargin;
      setContainerHeight(Math.max(400, availableHeight)); // Minimum 400px height
      
      // Calculate appropriate scale based on device width
      const containerWidth = containerRef.current?.clientWidth || 800;
      // A4 width is typically around 794px at 100% scale
      const resumeWidth = 794;
      const resumeHeight = resumeWidth * A4_ASPECT_RATIO;
      
      // Calculate scale
      let newScale = 0.5; // Default scale
      
      if (isMobileView) {
        // For mobile, scale to fit width with minimal padding
        newScale = (containerWidth - 20) / resumeWidth;
      } else {
        // For desktop, prioritize height more to show more content
        newScale = Math.min(
          (containerWidth - 20) / resumeWidth,  // Reduced padding
          (availableHeight - 20) / resumeHeight // Reduced padding
        );
        
        // For larger screens, we can afford to use a bit more space
        if (viewportWidth > 1280) {
          newScale = Math.min(newScale * 1.1, 0.95); // Increase scale slightly
        }
      }
      
      // Limit scale to reasonable values but allow larger scale on bigger screens
      newScale = Math.max(0.3, Math.min(newScale, 0.95));
      setScale(newScale);
      
      console.log("📏 Container height calculated:", Math.max(400, availableHeight));
      console.log("📏 Scale calculated:", newScale);
    };
    
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    
    console.timeEnd("⏱️ Height calculation");
    
    return () => {
      window.removeEventListener('resize', calculateDimensions);
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
        className="flex w-full justify-center overflow-y-auto bg-muted rounded-lg p-2 print:h-auto print:overflow-visible print:bg-white print:p-0 print:rounded-none"
        style={{ height: `${containerHeight}px` }}
      >
        {isReady && (
          <div className="resume-preview-container w-full max-w-4xl flex justify-center items-start overflow-visible print:max-w-none print:shadow-none print:w-full print:h-full print:scale-100">
            <div style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-in-out',
              marginBottom: `${30 * scale}px` // Add some bottom margin that scales with the content
            }}>
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
