import ResumePreview from "@/components/ResumePreview";
import { cn } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import ColorPicker from "./ColorPicker";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ResumePreviewSectionProps {
  resumeData: ResumeValues;
  setResumeData: (data: ResumeValues) => void;
  className?: string;
  showFormattingControls?: boolean;
}

// A4 dimensions in pixels at 96 DPI (standard screen resolution)
const A4_WIDTH_PX = 790; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1122; // 297mm at 96 DPI
const A4_ASPECT_RATIO = A4_HEIGHT_PX / A4_WIDTH_PX; // 1.414

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
  const [baseScale, setBaseScale] = useState(0.5);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.3));
  };
  
  const handleResetZoom = () => {
    setScale(0.61);
  };
  
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
      
      // Calculate scale
      let newScale = 0.5; // Default scale
      
      if (isMobileView) {
        // For mobile, scale to fit width with minimal padding
        newScale = (containerWidth - 40) / A4_WIDTH_PX;
      } else {
        // For desktop, prioritize height more to show more content
        newScale = Math.min(
          (containerWidth - 40) / A4_WIDTH_PX,  // Reduced padding
          (availableHeight - 40) / A4_HEIGHT_PX // Reduced padding
        );
        
        // For larger screens, we can afford to use a bit more space
        if (viewportWidth > 1280) {
          newScale = Math.min(newScale * 1.1, 0.95); // Increase scale slightly
        }
      }
      
      // Limit scale to reasonable values but allow larger scale on bigger screens
      newScale = Math.max(0.3, Math.min(newScale, 0.95));
      setBaseScale(newScale);
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
  
  // Center the resume when component is ready
  useEffect(() => {
    console.log("⚡ Setting isReady to true");
    setIsReady(true);
    
    // Center the resume after it's rendered
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const contentWidth = container.scrollWidth;
        const contentHeight = container.scrollHeight;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Scroll to center
        container.scrollLeft = (contentWidth - containerWidth) / 2;
        container.scrollTop = (contentHeight - containerHeight) / 2; // Start at top but centered horizontally
      }
    }, 100);
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

  // Calculate zoom percentage for display
  const zoomPercentage = Math.round(scale * 100);

  // Prefetch console times to prevent ReactNode errors
  useEffect(() => {
    if (isReady) {
      console.time("⏱️ ResumePreview component render");
      console.timeEnd("⏱️ ResumePreview component render");
    }
  }, [isReady]);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
    >
      <div className="absolute right-3 top-3 flex flex-col gap-3 z-20 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground" 
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <span className="text-lg font-bold">−</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-2 bg-primary/90 hover:bg-primary text-primary-foreground text-xs" 
            onClick={handleResetZoom}
            title="Reset zoom"
          >
            {zoomPercentage}%
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground" 
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <span className="text-lg font-bold">+</span>
          </Button>
        </div>
        {!showFormattingControls && (
          <ColorPicker
            color={resumeData.colorHex}
            onChange={(color) =>
              setResumeData({ ...resumeData, colorHex: color.hex })
            }
          />
        )}
      </div>
      {/* Scrollable viewport with zoomed resume */}
      <div
        className="w-full h-full bg-muted overflow-auto rounded-lg p-4 print:rounded-none print:p-0 print:bg-white print:overflow-visible"
        style={{ height: `${containerHeight}px` }}
        ref={scrollContainerRef}
      >
        {isReady && (
          <div
            className="resume-preview-container flex justify-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              margin: '50px auto',
              width: 'fit-content',
              padding: `${50 * scale}px`,
              minHeight: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <ResumePreview
              resumeData={resumeData}
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
