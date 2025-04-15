"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, Loader2, User, CheckCircle2, Crop, Sparkles, AlertTriangle } from "lucide-react";
import { generateAIResume } from "./actions";
import { toast } from "sonner";
import ImageCropper from "@/components/ImageCropper";
import SuccessModal from "@/components/SuccessModal";
import Link from "next/link";
import { getResume } from "@/app/(main)/resumes/actions";

export default function AIResumeUploader() {
  const router = useRouter();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<{
    matchingPoints: string[];
    prioritizedSkills: string[];
    reason: string | null;
  } | undefined>(undefined);
  
  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      if (originalPhotoUrl && originalPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(originalPhotoUrl);
      }
    };
  }, [photoPreview, originalPhotoUrl]);

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (file.type === "application/pdf" || 
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        
        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File is too large. Maximum size is 10MB");
          return;
        }
        
        setCvFile(file);
        console.log("File selected:", file.name, file.type, file.size);
      } else {
        toast.error("Please upload a PDF or DOCX file");
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo is too large. Maximum size is 5MB");
        return;
      }
      
      // If the file is still quite large (over 2MB), warn the user
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Large image detected. The photo will be compressed for better performance.");
      }
      
      // Create a temporary URL instead of loading the full image into memory
      const objectUrl = URL.createObjectURL(file);
      setOriginalPhotoUrl(objectUrl);
      setShowCropper(true);
      
      // We'll clean up the object URL when cropper is closed
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Create a file from the blob
    const fileName = photo?.name || "profile-photo.jpg";
    const croppedFile = new File([croppedImageBlob], fileName, {
      type: "image/jpeg" // Always use JPEG format for consistency
    });
    
    setPhoto(croppedFile);
    
    // Clean up any object URL we created for the original photo
    if (originalPhotoUrl && originalPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalPhotoUrl);
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedFile);
    setPhotoPreview(previewUrl);
    setOriginalPhotoUrl(null); // Clear the original photo url to free memory
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!cvFile) {
      toast.error("Please upload your previous CV");
      return;
    }
    
    if (!jobDescription) {
      toast.error("Please provide a job description");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Submitting CV file:", cvFile.name, cvFile.type, cvFile.size);
      
      // STEP 1: Parse the CV file
      const formData = new FormData();
      formData.append("file", cvFile);
      
      const parseResponse = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });
      
      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || "Failed to parse CV file");
      }
      
      const { parsedText } = await parseResponse.json();
      
      if (!parsedText) {
        throw new Error("Failed to extract text from CV");
      }
      
      // STEP 2: Generate resume using the parsed text
      const generateResponse = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedText,
          jobDescription,
          additionalInfo
        }),
      });
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }
      
      const { result } = await generateResponse.json();
      
      // The rest of the function stays the same - use server action to save the resume
      const resumeId = await generateAIResume(
        cvFile, 
        jobDescription, 
        additionalInfo,
        photo,
        result // Pass the generated resume data as an additional parameter
      );

      // Set the ID first
      setGeneratedResumeId(resumeId);
      
      // Set a default analysis while we load the real one
      setAnalysisData({
        matchingPoints: ["Loading analysis..."],
        prioritizedSkills: [],
        reason: "Analysis is being loaded..."
      });
      
      // Show the modal right away with the loading state
      setShowSuccessModal(true);
      
      // Then fetch the resume data asynchronously
      try {
        const resume = await getResume(resumeId);
        if (resume) {
          // Cast the resume to a type that includes our analysis fields
          const resumeWithAnalysis = resume as unknown as {
            matchingPoints: string[];
            prioritizedSkills: string[];
            analysisReason: string | null;
          };
          
          setAnalysisData({
            matchingPoints: resumeWithAnalysis.matchingPoints || [],
            prioritizedSkills: resumeWithAnalysis.prioritizedSkills || [],
            reason: resumeWithAnalysis.analysisReason || null
          });
        }
      } catch (fetchError) {
        // If we fail to fetch analysis data, we already have default values set
        console.error("Could not fetch analysis data:", 
          fetchError instanceof Error ? fetchError.message : "Unknown error");
      }
      
    } catch (error) {
      // Prevent unhandled error objects from being passed directly to console.error
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error generating resume:", errorMessage);
      
      // Simplified user-friendly error message that doesn't expose implementation details
      setErrorMsg("We couldn't generate your resume. Please try again or use a different file format.");
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = (redirectToEditor = false) => {
    setShowSuccessModal(false);
    if (redirectToEditor && generatedResumeId) {
      router.push(`/editor?resumeId=${generatedResumeId}`);
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <div className="w-full max-w-none p-6 md:p-10">
        {/* Header with Logo and Back Button */}
        <div className="flex justify-between items-center mb-12 border-b pb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/resumes")}
            className="flex items-center text-base"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Resumes
          </Button>
          
          {/* Logo removed as requested */}
          
          {/* Empty div to balance the layout */}
          <div className="w-[120px]"></div>
        </div>
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-center">AI Resume Generator</h1>
          <p className="text-muted-foreground mt-2 text-center text-lg">
            Upload your previous CV and the job description to generate an optimized resume
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-4 text-base flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-destructive font-medium">Resume Generation Failed</h3>
                <p className="text-destructive/90 mt-1">{errorMsg}</p>
                <p className="text-sm text-destructive/80 mt-2">Please try again or use a different file.</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <span>Upload your previous CV (PDF or DOCX)</span>
                  {cvFile && (
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </h2>
                <div className="grid w-full items-center gap-1.5">
                  <Label 
                    htmlFor="cv-upload" 
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 ${cvFile ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10' : 'border-muted-foreground border-dashed'} p-8 h-[320px] text-center hover:bg-muted/50`}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="mb-4 rounded-full bg-muted/50 p-4">
                        <FileText className={`size-10 ${cvFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="mt-2 text-lg font-medium">
                        {cvFile ? cvFile.name : "Click to upload CV"}
                      </div>
                      <div className="mt-1 text-base text-muted-foreground">
                        PDF or DOCX up to 10MB
                      </div>
                      
                      {!cvFile && (
                        <p className="text-base text-muted-foreground mt-4 max-w-sm mx-auto">
                          Upload your CV to extract your work experience, education, and skills. 
                          The AI will use this to create a tailored resume for your application.
                        </p>
                      )}
                    </div>
                  </Label>
                  <Input 
                    id="cv-upload" 
                    type="file" 
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                    className="hidden" 
                    onChange={handleCvFileChange}
                  />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <span>Upload your photo (Optional)</span>
                  {photoPreview && (
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </h2>
                <div className="grid w-full items-center gap-1.5">
                  <Label 
                    htmlFor="photo-upload" 
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 ${photoPreview ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10' : 'border-muted-foreground border-dashed'} p-8 h-[320px] text-center hover:bg-muted/50`}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {photoPreview ? (
                        <div className="relative w-36 h-36 overflow-hidden rounded-full mb-4 border-2 border-green-500">
                          <Image 
                            src={photoPreview}
                            alt="Your photo"
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (originalPhotoUrl) {
                                  setShowCropper(true);
                                }
                              }}
                              className="bg-primary text-primary-foreground p-2 rounded-full mr-2"
                            >
                              <Crop className="size-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setPhoto(null);
                                setPhotoPreview(null);
                              }}
                              className="bg-destructive text-destructive-foreground p-2 rounded-full"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 rounded-full bg-muted/50 p-4">
                          <User className="size-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="mt-2 text-lg font-medium">
                        {photo ? photo.name : "Click to upload photo"}
                      </div>
                      <div className="mt-1 text-base text-muted-foreground">
                        JPG, PNG or WEBP up to 5MB
                      </div>
                      
                      {!photoPreview && (
                        <p className="text-base text-muted-foreground mt-4 max-w-sm mx-auto">
                          Adding a professional photo can enhance your resume. 
                          You can crop and adjust the image after uploading.
                        </p>
                      )}
                    </div>
                  </Label>
                  <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6 flex flex-col">
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <span>Job Description</span>
                  {jobDescription.length > 0 && (
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </h2>
                <div className={`flex flex-col rounded-md border-2 ${jobDescription.length > 0 ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10' : 'border-muted-foreground border-dashed'} p-6 h-[320px]`}>
                  <Textarea 
                    id="job-description"
                    placeholder="Paste the job description here..."
                    className="flex-1 min-h-0 resize-none border border-input bg-card shadow-sm rounded-md p-3 text-base focus-visible:ring-1 focus-visible:ring-primary" 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="mt-4">
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <strong>Tip:</strong> Including the full job description leads to better results than just the job title.
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <span>Additional Information (Optional)</span>
                  {additionalInfo.length > 0 && (
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </h2>
                <div className={`flex flex-col rounded-md border-2 ${additionalInfo.length > 0 ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10' : 'border-muted-foreground border-dashed'} p-6 h-[320px]`}>
                  <Textarea 
                    id="additional-info"
                    placeholder="Add any additional information about yourself that might be helpful..."
                    className="flex-1 min-h-0 resize-none border border-input bg-card shadow-sm rounded-md p-3 text-base focus-visible:ring-1 focus-visible:ring-primary"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                  <div className="mt-4">
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <strong>Examples:</strong> Recent training, soft skills, achievements, or career transitions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 mt-4 border-t flex flex-col items-center">
            <Button 
              type="submit" 
              size="lg"
              className="w-full sm:w-auto px-8 text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate AI Resume
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Please wait about 10 seconds for your AI resume to be built.
            </p>
          </div>
        </form>
      </div>
      
      {/* Image Cropper Modal */}
      {originalPhotoUrl && (
        <ImageCropper
          imageUrl={originalPhotoUrl}
          onCropComplete={handleCropComplete}
          open={showCropper}
          onClose={() => setShowCropper(false)}
          aspectRatio={1}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Resume Ready"
        message="Optimization complete"
        buttonText="Continue to Editor"
        analysis={analysisData}
      />
    </div>
  );
} 