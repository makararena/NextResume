import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ResumeServerData } from "./types";
import { ResumeValues } from "./validation";
import { monitoring } from './monitoring';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fileReplacer(key: unknown, value: unknown) {
  return value instanceof File
    ? {
        name: value.name,
        size: value.size,
        type: value.type,
        lastModified: value.lastModified,
      }
    : value;
}

export function mapToResumeValues(data: ResumeServerData): ResumeValues {
  return {
    id: data.id,
    title: data.title || undefined,
    description: data.description || undefined,
    photo: data.photoUrl || undefined,
    photoUrl: data.photoUrl || undefined,
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    jobTitle: data.jobTitle || undefined,
    city: data.city || undefined,
    country: data.country || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    workExperiences: data.workExperiences.map((exp) => ({
      position: exp.position || undefined,
      company: exp.company || undefined,
      startDate: exp.startDate?.toISOString().split("T")[0],
      endDate: exp.endDate?.toISOString().split("T")[0],
      description: exp.description || undefined,
    })),
    educations: data.educations.map((edu) => ({
      degree: edu.degree || undefined,
      school: edu.school || undefined,
      startDate: edu.startDate?.toISOString().split("T")[0],
      endDate: edu.endDate?.toISOString().split("T")[0],
      description: edu.description || undefined,
    })),
    skills: data.skills,
    borderStyle: data.borderStyle,
    colorHex: data.colorHex,
    template: data.template,
    summary: data.summary || undefined,
  };
}

/**
 * Format a date to YYYY-MM-DD format
 */
export function formatDateYYYMMDD(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return undefined;
  }
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Monitor memory usage and log it
 * This is a browser-only function
 */
export function logMemoryUsage(label: string) {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    // TypeScript doesn't recognize memory on performance by default
    const memory = (performance as any).memory;
    if (memory) {
      console.log(`📊 Memory [${label}]:`, {
        totalJSHeapSize: `${(memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
        usedJSHeapSize: `${(memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)} MB`,
        usagePercentage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
      });
    }
  }
}

/**
 * Safe console logging utility that sanitizes sensitive data
 * Use this instead of direct console.log to prevent leaking sensitive information
 */
export const safeConsole = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      monitoring.log({ message, level: 'debug', metadata: data });
    }
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      monitoring.log({ message, level: 'debug', metadata: data });
    }
  },
  
  info: (message: string, data?: any) => {
    monitoring.log({ message, level: 'info', metadata: data });
  },
  
  warn: (message: string, data?: any) => {
    monitoring.log({ message, level: 'warning', metadata: data });
  },
  
  error: (message: string, error?: Error, metadata?: any) => {
    if (error) {
      monitoring.captureError(message, error, metadata);
    } else {
      monitoring.log({ message, level: 'error', metadata });
    }
  },
  
  // Performance timing utilities that only run in development
  time: (label: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.timeEnd(label);
    }
  }
};
