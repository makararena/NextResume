import useDimensions from "@/hooks/useDimensions";
import { cn } from "@/lib/utils";
import { ResumeValues } from "@/lib/validation";
import { formatDate } from "date-fns";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import tinycolor from "tinycolor2";

interface ResumePreviewProps {
  resumeData: ResumeValues;
  className?: string;
}

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// A4 dimensions in pixels at 96 DPI (standard screen resolution)
const A4_WIDTH_PX = 793; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1122; // 297mm at 96 DPI

export default function ResumePreview({
  resumeData,
  className,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
  
  // Calculate the appropriate scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      // Get parent container
      const parent = containerRef.current.closest('.resume-preview-container');
      if (!parent) return;
      
      // Get available width (minus some padding)
      const availableWidth = parent.clientWidth - 20;
      
      // Calculate scale based on A4 width to fit container width
      const newScale = Math.min(1, availableWidth / A4_WIDTH_PX);
      setScale(newScale > 0.2 ? newScale : 0.2); // Limit minimum scale
    };
    
    // Initial update
    updateScale();
    
    // Add resize event listener
    window.addEventListener('resize', updateScale);
    
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const template = resumeData.template || "classic";

  const renderTemplate = () => {
    switch (template) {
      case "modern":
        return <ModernTemplate resumeData={resumeData} />;
      case "minimalist":
        return <MinimalistTemplate resumeData={resumeData} />;
      case "classic":
      default:
        return <ClassicTemplate resumeData={resumeData} />;
    }
  };

  return (
    <div className="relative w-full flex justify-center" style={{ minHeight: A4_HEIGHT_PX * scale }}>
      {/* A4 container with fixed dimensions */}
      <div
        style={{
          transform: `scale(${scale * 2})`,
          transformOrigin: "top center",
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          maxHeight: `${A4_HEIGHT_PX}px`,
        }}
        className={cn(
          "bg-white text-black print:scale-100 print:w-[210mm] print:h-[297mm] print:max-h-[297mm] print:overflow-hidden shadow-lg",
          className,
        )}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full overflow-hidden" 
          style={{
            maxHeight: `${A4_HEIGHT_PX}px`,
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}

// Classic Template (Original Template)
function ClassicTemplate({ resumeData }: { resumeData: ResumeValues }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    // Check if in print mode on client-side only
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia('print');
      const handlePrintChange = (e: MediaQueryListEvent) => {
        setIsPrinting(e.matches);
      };
      
      // Set initial value
      setIsPrinting(mediaQueryList.matches);
      
      // Add listener for changes
      mediaQueryList.addEventListener('change', handlePrintChange);
      
      // Cleanup
      return () => {
        mediaQueryList.removeEventListener('change', handlePrintChange);
      };
    }
  }, []);

  return (
    <div
      className="space-y-8 p-7 print:p-7 h-full overflow-hidden"
      style={{
        transform: isPrinting ? 'none' : undefined,
        maxHeight: `${A4_HEIGHT_PX}px`,
      }}
      ref={containerRef}
    >
      <PersonalInfoHeader resumeData={resumeData} />
      <SummarySection resumeData={resumeData} />
      <WorkExperienceSection resumeData={resumeData} />
      <EducationSection resumeData={resumeData} />
      <SkillsSection resumeData={resumeData} />
    </div>
  );
}

// Modern Template
function ModernTemplate({ resumeData }: { resumeData: ResumeValues }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorHex = resumeData.colorHex || "#1A73E8";
  const isLightColor = tinycolor(colorHex).isLight();
  const textColor = isLightColor ? "#333333" : "#FFFFFF";
  const borderColor = isLightColor ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)";
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    // Check if in print mode on client-side only
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia('print');
      const handlePrintChange = (e: MediaQueryListEvent) => {
        setIsPrinting(e.matches);
      };
      
      // Set initial value
      setIsPrinting(mediaQueryList.matches);
      
      // Add listener for changes
      mediaQueryList.addEventListener('change', handlePrintChange);
      
      // Cleanup
      return () => {
        mediaQueryList.removeEventListener('change', handlePrintChange);
      };
    }
  }, []);
  
  return (
    <div
      className="grid grid-cols-3 gap-6 h-full print:h-full overflow-hidden"
      style={{
        transform: isPrinting ? 'none' : undefined,
        maxHeight: `${A4_HEIGHT_PX}px`,
      }}
      ref={containerRef}
    >
      <div 
        className="col-span-1 p-7 flex flex-col print:overflow-hidden overflow-hidden"
        style={{ 
          backgroundColor: colorHex,
          maxHeight: `${A4_HEIGHT_PX}px`,
        }}
      >
        <div className="mb-8 text-center">
          <ModernPersonalInfo resumeData={resumeData} textColor={textColor} />
        </div>
        
        <div className="space-y-7" style={{ color: textColor }}>
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2" style={{ borderColor: borderColor }}>Contact</h2>
            <div className="space-y-3">
              <p className="text-sm break-words print:max-w-full">{resumeData.email}</p>
              <p className="text-sm break-words print:max-w-full">{resumeData.phone}</p>
              <p className="text-sm break-words print:max-w-full">
                {resumeData.city}{resumeData.city && resumeData.country && ", "}{resumeData.country}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2" style={{ borderColor: borderColor }}>Skills</h2>
            <ModernSkillsList resumeData={resumeData} textColor={textColor} />
          </div>
        </div>
      </div>
      
      <div className="col-span-2 p-7 flex flex-col space-y-7 print:overflow-hidden overflow-hidden" style={{ maxHeight: `${A4_HEIGHT_PX}px` }}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold"
            style={{ color: colorHex }}
          >PROFESSIONAL SUMMARY</h2>
          <div className="whitespace-pre-line text-sm leading-relaxed">{resumeData.summary}</div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold"
            style={{ color: colorHex }}
          >WORK EXPERIENCE</h2>
          <ModernWorkExperience resumeData={resumeData} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-bold"
            style={{ color: colorHex }}
          >EDUCATION</h2>
          <ModernEducation resumeData={resumeData} />
        </div>
      </div>
    </div>
  );
}

// Minimalist Template
function MinimalistTemplate({ resumeData }: { resumeData: ResumeValues }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    // Check if in print mode on client-side only
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia('print');
      const handlePrintChange = (e: MediaQueryListEvent) => {
        setIsPrinting(e.matches);
      };
      
      // Set initial value
      setIsPrinting(mediaQueryList.matches);
      
      // Add listener for changes
      mediaQueryList.addEventListener('change', handlePrintChange);
      
      // Cleanup
      return () => {
        mediaQueryList.removeEventListener('change', handlePrintChange);
      };
    }
  }, []);
  
  return (
    <div
      className="p-10 space-y-7 print:p-10 h-full overflow-hidden"
      style={{
        transform: isPrinting ? 'none' : undefined,
        maxHeight: `${A4_HEIGHT_PX}px`,
      }}
      ref={containerRef}
    >
      <div className="text-center mb-7">
        <h1 className="text-3xl font-light tracking-wide" style={{ color: resumeData.colorHex }}>
          {resumeData.firstName} {resumeData.lastName}
        </h1>
        <p className="text-md font-light">{resumeData.jobTitle}</p>
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-3 text-sm text-gray-600">
          {resumeData.email && <span className="break-words">{resumeData.email}</span>}
          {resumeData.phone && resumeData.email && <span className="hidden sm:inline">•</span>}
          {resumeData.phone && <span className="break-words">{resumeData.phone}</span>}
          {(resumeData.email || resumeData.phone) && (resumeData.city || resumeData.country) && <span className="hidden sm:inline">•</span>}
          {(resumeData.city || resumeData.country) && (
            <span className="break-words">
              {resumeData.city}{resumeData.city && resumeData.country && ", "}{resumeData.country}
            </span>
          )}
        </div>
      </div>
      
      {resumeData.summary && (
        <div className="space-y-3">
          <h2 className="text-md font-semibold uppercase tracking-wider" style={{ color: resumeData.colorHex }}>
            Summary
          </h2>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm whitespace-pre-line leading-relaxed">{resumeData.summary}</p>
          </div>
        </div>
      )}
      
      <MinimalistWorkExperience resumeData={resumeData} />
      <MinimalistEducation resumeData={resumeData} />
      <MinimalistSkills resumeData={resumeData} />
    </div>
  );
}

interface ResumeSectionProps {
  resumeData: ResumeValues;
}

function PersonalInfoHeader({ resumeData }: ResumeSectionProps) {
  const {
    photo,
    firstName,
    lastName,
    jobTitle,
    city,
    country,
    phone,
    email,
    colorHex,
    borderStyle,
  } = resumeData;

  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo);

  useEffect(() => {
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : "";
    if (objectUrl) setPhotoSrc(objectUrl);
    if (photo === null) setPhotoSrc("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="flex items-center gap-6">
      {photoSrc && (
        <Image
          src={photoSrc}
          width={100}
          height={100}
          alt="Author photo"
          className="aspect-square object-cover"
          style={{
            borderRadius: "9999px",
          }}
        />
      )}
      <div className="space-y-2.5">
        <div className="space-y-1">
          <p
            className="text-3xl font-bold"
            style={{
              color: colorHex,
            }}
          >
            {firstName} {lastName}
          </p>
          <p
            className="font-medium"
            style={{
              color: colorHex,
            }}
          >
            {jobTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500">
          {city && <span>{city}</span>}
          {city && country && <span>,</span>}
          {country && <span>{country}</span>}
          {(city || country) && (phone || email) && <span className="hidden sm:inline">•</span>}
          {phone && <span className="break-words">{phone}</span>}
          {phone && email && <span className="hidden sm:inline">•</span>}
          {email && <span className="break-words">{email}</span>}
        </div>
      </div>
    </div>
  );
}

function SummarySection({ resumeData }: ResumeSectionProps) {
  const { summary, colorHex } = resumeData;

  if (!summary) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="break-inside-avoid space-y-4">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Professional profile
        </p>
        <div className="whitespace-pre-line text-sm leading-relaxed">{summary}</div>
      </div>
    </>
  );
}

function WorkExperienceSection({ resumeData }: ResumeSectionProps) {
  const { workExperiences, colorHex } = resumeData;

  const workExperiencesNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  if (!workExperiencesNotEmpty?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="space-y-4">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Work experience
        </p>
        {workExperiencesNotEmpty.map((exp, index) => (
          <div key={index} className="break-inside-avoid space-y-2">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{
                color: colorHex,
              }}
            >
              <span>{exp.position}</span>
              {exp.startDate && (
                <span>
                  {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                  {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "Present"}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold">{exp.company}</p>
            <div className="whitespace-pre-line text-xs leading-relaxed">{exp.description}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function EducationSection({ resumeData }: ResumeSectionProps) {
  const { educations, colorHex } = resumeData;

  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );

  if (!educationsNotEmpty?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Education
        </p>
        {educationsNotEmpty.map((edu, index) => (
          <div key={index} className="break-inside-avoid space-y-1">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{
                color: colorHex,
              }}
            >
              <span>{edu.degree}</span>
              {edu.startDate && (
                <span>
                  {edu.startDate &&
                    `${formatDate(edu.startDate, "MM/yyyy")} ${edu.endDate ? `- ${formatDate(edu.endDate, "MM/yyyy")}` : ""}`}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold">{edu.school}</p>
            {edu.description && <p className="text-xs mt-1 text-gray-600 whitespace-pre-wrap">{edu.description}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

function SkillsSection({ resumeData }: ResumeSectionProps) {
  const { skills, colorHex, borderStyle } = resumeData;

  if (!skills?.length) return null;

  return (
    <>
      <hr
        className="border-2"
        style={{
          borderColor: colorHex,
        }}
      />
      <div className="break-inside-avoid space-y-3">
        <p
          className="text-lg font-semibold"
          style={{
            color: colorHex,
          }}
        >
          Skills
        </p>
        <div className="flex break-inside-avoid flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              className="rounded-md bg-black text-white hover:bg-black"
              style={{
                backgroundColor: colorHex,
                borderRadius: "9999px",
              }}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}

// New Modern Template Components
function ModernPersonalInfo({ resumeData, textColor }: ResumeSectionProps & { textColor: string }) {
  const { photo, firstName, lastName, jobTitle } = resumeData;
  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo);

  useEffect(() => {
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : "";
    if (objectUrl) setPhotoSrc(objectUrl);
    if (photo === null) setPhotoSrc("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="flex flex-col items-center">
      {photoSrc && (
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-3">
          <Image
            src={photoSrc}
            width={128}
            height={128}
            alt="Author photo"
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <h1 className="text-xl font-bold" style={{ color: textColor }}>{firstName} {lastName}</h1>
      <p className="text-sm mt-1" style={{ color: textColor, opacity: 0.8 }}>{jobTitle}</p>
    </div>
  );
}

function ModernSkillsList({ resumeData, textColor }: ResumeSectionProps & { textColor: string }) {
  const { skills } = resumeData;
  
  if (!skills?.length) return null;
  
  return (
    <div className="flex flex-col gap-2">
      {skills.map((skill, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: textColor }}></div>
          <span className="text-sm">{skill}</span>
        </div>
      ))}
    </div>
  );
}

function ModernWorkExperience({ resumeData }: ResumeSectionProps) {
  const { workExperiences } = resumeData;
  
  const workExperiencesNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  if (!workExperiencesNotEmpty?.length) return null;
  
  return (
    <div className="space-y-5">
      {workExperiencesNotEmpty.map((exp, index) => (
        <div key={index} className="break-inside-avoid">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-md">{exp.position}</h3>
            <span className="text-xs text-gray-600">
              {exp.startDate && (
                <>
                  {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                  {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "Present"}
                </>
              )}
            </span>
          </div>
          <p className="text-sm font-medium">{exp.company}</p>
          <p className="text-sm mt-2 whitespace-pre-line leading-relaxed">{exp.description}</p>
        </div>
      ))}
    </div>
  );
}

function ModernEducation({ resumeData }: ResumeSectionProps) {
  const { educations } = resumeData;
  
  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );

  if (!educationsNotEmpty?.length) return null;
  
  return (
    <div className="space-y-4">
      {educationsNotEmpty.map((edu, index) => (
        <div key={index} className="break-inside-avoid">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-md">{edu.degree}</h3>
            <span className="text-xs text-gray-600">
              {edu.startDate && (
                <>
                  {formatDate(edu.startDate, "MM/yyyy")}
                  {edu.endDate && ` - ${formatDate(edu.endDate, "MM/yyyy")}`}
                </>
              )}
            </span>
          </div>
          <p className="text-sm font-medium">{edu.school}</p>
          {edu.description && <p className="text-xs mt-1 text-gray-600 whitespace-pre-wrap">{edu.description}</p>}
        </div>
      ))}
    </div>
  );
}

// Minimalist Template Components
function MinimalistWorkExperience({ resumeData }: ResumeSectionProps) {
  const { workExperiences, colorHex } = resumeData;
  
  const workExperiencesNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  if (!workExperiencesNotEmpty?.length) return null;
  
  return (
    <div className="space-y-3">
      <h2 className="text-md font-semibold uppercase tracking-wider" style={{ color: colorHex }}>
        Experience
      </h2>
      <div className="border-t border-gray-200 pt-3 space-y-5">
        {workExperiencesNotEmpty.map((exp, index) => (
          <div key={index} className="break-inside-avoid">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">{exp.company}</h3>
              <span className="text-xs text-gray-500">
                {exp.startDate && (
                  <>
                    {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                    {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "Present"}
                  </>
                )}
              </span>
            </div>
            <p className="text-xs italic mb-2">{exp.position}</p>
            <p className="text-xs whitespace-pre-line leading-relaxed">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MinimalistEducation({ resumeData }: ResumeSectionProps) {
  const { educations, colorHex } = resumeData;
  
  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );

  if (!educationsNotEmpty?.length) return null;
  
  return (
    <div className="space-y-2">
      <h2 className="text-md font-semibold uppercase tracking-wider" style={{ color: colorHex }}>
        Education
      </h2>
      <div className="border-t border-gray-200 pt-2 space-y-4">
        {educationsNotEmpty.map((edu, index) => (
          <div key={index} className="break-inside-avoid">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">{edu.school}</h3>
              <span className="text-xs text-gray-500">
                {edu.startDate && (
                  <>
                    {formatDate(edu.startDate, "MM/yyyy")}
                    {edu.endDate && ` - ${formatDate(edu.endDate, "MM/yyyy")}`}
                  </>
                )}
              </span>
            </div>
            <p className="text-xs italic">{edu.degree}</p>
            {edu.description && <p className="text-xs mt-1 text-gray-500 whitespace-pre-wrap">{edu.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MinimalistSkills({ resumeData }: ResumeSectionProps) {
  const { skills, colorHex } = resumeData;
  
  if (!skills?.length) return null;
  
  return (
    <div className="space-y-2">
      <h2 className="text-md font-semibold uppercase tracking-wider" style={{ color: colorHex }}>
        Skills
      </h2>
      <div className="border-t border-gray-200 pt-3">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded border"
              style={{ borderColor: colorHex, color: colorHex }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
