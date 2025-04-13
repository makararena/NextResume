/**
 * SuccessModal Component
 * 
 * Displays a success modal with animation and information about the resume generation.
 * Includes matching points, prioritized skills, and analysis of how the user matches the job.
 */
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { CheckCircle, X, BarChart, Database, Code, Check, ChevronDown } from "lucide-react";

/**
 * Props for the SuccessModal component
 * @property {boolean} isOpen - Controls visibility of the modal
 * @property {function} onClose - Handler called when closing the modal
 * @property {string} title - Modal title
 * @property {string} message - Modal message
 * @property {string} buttonText - Text for the action button, defaults to "OK"
 * @property {object} analysis - Optional analysis data including matching points, skills, and reasoning
 */
interface SuccessModalProps {
  isOpen: boolean;
  onClose: (redirect: boolean) => void;
  title: string;
  message: string;
  buttonText?: string;
  analysis?: {
    matchingPoints?: string[];
    prioritizedSkills?: string[];
    reason?: string | null;
  };
}

/**
 * Truncates text to specified length and adds ellipsis if needed
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
const truncateText = (text: string, maxLength: number = 200) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  analysis
}: SuccessModalProps) {
  // State to track if content is scrollable
  const [canScroll, setCanScroll] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  
  /**
   * Check if the content is scrollable when modal opens or content changes
   */
  useEffect(() => {
    if (analysisRef.current && isOpen) {
      setCanScroll(analysisRef.current.scrollHeight > analysisRef.current.clientHeight);
    }
  }, [analysis, isOpen]);
  
  /**
   * Returns appropriate icon based on skill name
   * @param {string} skill - Skill name to match with icon
   * @returns {JSX.Element} - Appropriate icon component
   */
  const getSkillIcon = (skill: string) => {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes('bi') || lowerSkill.includes('chart') || lowerSkill.includes('visual')) {
      return <BarChart className="h-4 w-4 text-green-400" />;
    } else if (lowerSkill.includes('data') || lowerSkill.includes('sql') || lowerSkill.includes('database')) {
      return <Database className="h-4 w-4 text-green-400" />;
    } else {
      return <Code className="h-4 w-4 text-green-400" />;
    }
  };
  
  // Limit skills display to top 3 for UI clarity
  const limitedSkills = analysis?.prioritizedSkills?.slice(0, 3) || [];
  
  // Process matching points for display with truncation
  const displayPoints = analysis?.matchingPoints?.map(point => truncateText(point, 150)) || [];
  
  // Don't render anything if modal is closed
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-lg mx-auto flex flex-col items-center relative"
      >
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
          className="absolute top-2 right-2 bg-gray-800 text-white p-1 rounded-full z-10"
          onClick={() => onClose(false)}
        >
          <X className="h-4 w-4" />
        </motion.button>
        
        <div className="text-center text-white w-full">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="mb-4"
          >
            <div className="inline-block bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-full mb-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">
              Your Resume is Ready!
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Optimized for your job application
            </p>
          </motion.div>
          
          {/* Analysis section - only rendered if analysis data exists */}
          {analysis && (
            <motion.div
              ref={analysisRef}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 p-4 rounded-lg text-left mb-6 shadow-xl border border-white/10 max-h-[70vh] overflow-y-auto relative"
            >
              {/* Matching points section */}
              {displayPoints.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Your Strengths for This Role :</h4>
                  <ul className="space-y-2">
                    {displayPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <div className="text-green-400 mr-2 mt-0.5 flex-shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <p className="text-gray-200 text-sm">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Skills section */}
              {limitedSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Your Standout Skills :</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {limitedSkills.map((skill, index) => (
                      <div key={index} className="bg-white/10 rounded-full px-2 py-0.5 flex items-center">
                        {getSkillIcon(skill)}
                        <span className="ml-1 text-xs text-gray-200">{truncateText(skill, 15)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reasoning section */}
              {analysis.reason && (
                <div>
                  <h4 className="text-white font-semibold mb-1">How You Match the Role :</h4>
                  <p className="text-gray-200 text-sm">
                    {truncateText(analysis.reason, 250)}
                  </p>
                </div>
              )}
              
              {/* Scroll indicator - only shows when content is scrollable */}
              {canScroll && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none flex justify-center items-end pb-2">
                  <ChevronDown className="h-5 w-5 text-white/70 animate-bounce" />
                </div>
              )}
            </motion.div>
          )}
          
          {/* Action button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full flex gap-3"
          >
            <Button 
              onClick={() => onClose(true)}
              size="default"
              className="w-full py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white shadow"
            >
              {buttonText}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}