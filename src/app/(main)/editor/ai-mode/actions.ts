"use server";

import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import path from "path";
import { ResumeValues } from "@/lib/validation";
import { OpenAIClient } from "@/lib/openai";
import prisma from "@/lib/prisma";
import pdfParse from "pdf-parse";

// Extract text from PDF file
async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdfParse(buffer);
  return data.text;
}

// Main function to generate an AI resume
export async function generateAIResume(
  cvFile: File,
  jobDescription: string,
  additionalInfo?: string,
  photo?: File | null,
  resumeJson?: string // New parameter for pre-generated resume data
): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    console.log("Processing CV file:", cvFile.name, cvFile.type, cvFile.size);

    // 1. Upload the original file to blob storage for reference
    const fileName = `cv_${Date.now()}${path.extname(cvFile.name)}`;
    const blob = await put(fileName, cvFile, {
      access: "public",
    });
    console.log("File uploaded to:", blob.url);

    // Upload photo if provided
    let photoUrl = null;
    if (photo) {
      console.log("Processing photo:", photo.name, photo.type, photo.size);
      const photoFileName = `photo_${Date.now()}${path.extname(photo.name)}`;
      const photoBlob = await put(photoFileName, photo, {
        access: "public",
      });
      photoUrl = photoBlob.url;
      console.log("Photo uploaded to:", photoUrl);
    }

    // Get the resume data either from the provided JSON or generate it
    let resumeJsonResponse: string;
    let extractedCvContent: string = "";

    if (resumeJson) {
      // Use the pre-generated resume JSON from the API
      console.log("Using pre-generated resume data");
      resumeJsonResponse = resumeJson;
    } else {
      // Original flow - extract content and generate resume
      const mimeType = cvFile.type;
      const openai = new OpenAIClient();

      if (mimeType === "application/pdf") {
        console.log("Extracting text from PDF...");
        extractedCvContent = await extractTextFromPdf(cvFile);
        console.log("Text extraction complete.");
      } else if (mimeType === "image/png" || mimeType === "image/jpeg") {
        console.log("Processing image via OpenAI Vision...");
        const base64Image = await fileToBase64(cvFile);

        // Ask OpenAI to extract text from the image directly
        extractedCvContent = await openai.analyzeImage(base64Image, jobDescription, additionalInfo);
        console.log("Image text extraction complete.");
      } else {
        throw new Error("Unsupported file type. Please upload PDF, PNG, or JPEG.");
      }

      // Generate resume data using OpenAI
      console.log("Generating tailored resume...");
      resumeJsonResponse = await openai.generateResumeFromVisionAnalysis(
        extractedCvContent,
        jobDescription,
        additionalInfo
      );
    }

    // Parse the JSON response from OpenAI
    let resumeData: ResumeValues;
    try {
      resumeData = JSON.parse(resumeJsonResponse);
    } catch (error) {
      console.error("Failed to parse resume JSON:", error);
      const jsonMatch =
        resumeJsonResponse.match(/```(?:json)?([\s\S]*?)```/) ||
        resumeJsonResponse.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        try {
          resumeData = JSON.parse(
            jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0]
          );
        } catch (nestedError) {
          console.error("Failed to extract JSON from response:", nestedError);
          throw new Error("Failed to parse AI response");
        }
      } else {
        throw new Error("Failed to extract valid JSON from AI response");
      }
    }

    // Save the resume in the database
    const resume = await createResumeFromAI(
      userId,
      resumeData,
      blob.url,
      extractedCvContent,
      photoUrl,
      jobDescription
    );
    return resume.id;

  } catch (error) {
    console.error("AI Resume generation error:", error);
    // Log the actual error for debugging but return a generic message to the user
    if (error instanceof Error && error.message.includes("Invalid Date")) {
      throw new Error("There was an issue with the date format in your resume. Please try again.");
    } else if (error instanceof Error && error.message.includes("prisma")) {
      throw new Error("There was an issue saving your resume. Please try again.");
    } else {
      throw new Error("Failed to generate resume. Please try again or use a different file format.");
    }
  }
}

// Helper: convert file to base64 string
async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

// Helper: save resume in DB
async function createResumeFromAI(
  userId: string,
  resumeData: ResumeValues,
  cvFileUrl: string,
  extractedCvContent: string,
  photoUrl?: string | null,
  jobDescription?: string
): Promise<{ id: string }> {
  const { workExperiences, educations, skills, analysis, ...resumeValues } = resumeData;

  // Extract analysis data if available
  const matchingPoints = analysis?.matchingPoints || [];
  const prioritizedSkills = analysis?.prioritizedSkills || [];
  const analysisReason = analysis?.reason || null;

  // Extract company name and job title from the title if available
  let companyName = 'Company';
  let jobTitle = resumeData.jobTitle || 'Position';
  
  // Check if title contains the company name and job title
  if (resumeValues.title) {
    // Try to parse the title format
    const titleParts = resumeValues.title.split(' ');
    if (titleParts.length >= 3) {
      // Assume the last word is "Resume" and the second-to-last is part of the job title
      // Everything before that is considered the company name
      const lastIndex = titleParts.length - 1;
      if (titleParts[lastIndex].toLowerCase() === 'resume') {
        // Extract job title - could be multiple words
        const jobTitleWords = [];
        let i = lastIndex - 1;
        // Go backwards from the end until we find a reasonable company name length
        while (i >= 0 && i >= lastIndex - 3) {
          jobTitleWords.unshift(titleParts[i]);
          i--;
        }
        
        // Combine the remaining words as company name
        companyName = titleParts.slice(0, i + 1).join(' ');
        jobTitle = jobTitleWords.join(' ');
      }
    }
  }
  
  let projectTitle = `${companyName} ${jobTitle} Resume`;

  // Check for duplicate titles
  const escapedTitle = projectTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleRegex = new RegExp(`^${escapedTitle}(?: \\((\\d+)\\))?$`);
  
  const existingResumes = await prisma.resume.findMany({
    where: {
      userId,
      title: {
        startsWith: projectTitle,
      },
    },
    select: {
      title: true,
    },
  });

  // Find the highest number in parentheses (if any)
  let highestNumber = 0;
  existingResumes.forEach(resume => {
    const match = resume.title?.match(titleRegex);
    if (match) {
      if (match[1]) {
        const number = parseInt(match[1], 10);
        if (number > highestNumber) {
          highestNumber = number;
        }
      } else {
        // Title exists without a number, so we'll at least need (1)
        highestNumber = Math.max(highestNumber, 1);
      }
    }
  });
  
  // If duplicates exist, append a number
  if (highestNumber > 0) {
    projectTitle = `${projectTitle} (${highestNumber + 1})`;
  }

  // Create the resume in the database
  const resume = await prisma.resume.create({
    data: {
      ...resumeValues,
      title: projectTitle, // Now with unique numbering if needed
      userId,
      photoUrl: photoUrl || null,
      description: `Professional ATS-optimized resume for ${jobTitle} role at ${companyName}. 
Created using AI assistance based on candidate's authentic qualifications and experience.
Job description: ${jobDescription || "Not provided"}`, 
      workExperiences: {
        create: workExperiences?.map((exp) => ({
          ...exp,
          startDate: exp.startDate && !isNaN(new Date(exp.startDate).getTime()) ? new Date(exp.startDate) : null,
          endDate: exp.endDate && !isNaN(new Date(exp.endDate).getTime()) ? new Date(exp.endDate) : null,
        })),
      },
      educations: {
        create: educations?.map((edu) => ({
          ...edu,
          startDate: edu.startDate && !isNaN(new Date(edu.startDate).getTime()) ? new Date(edu.startDate) : null,
          endDate: edu.endDate && !isNaN(new Date(edu.endDate).getTime()) ? new Date(edu.endDate) : null,
        })),
      },
      skills: skills || [],
      // Save analysis data
      matchingPoints,
      prioritizedSkills,
      analysisReason,
    },
  });

  // Store the CV URL using a raw query if the field exists in the database
  // Attempt to update the record with the CV URL
  try {
    await prisma.$executeRaw`UPDATE "resumes" SET "cvUrl" = ${cvFileUrl} WHERE "id" = ${resume.id}`;
    
    // Also update the jobDescription field
    if (jobDescription) {
      await prisma.$executeRaw`UPDATE "resumes" SET "jobDescription" = ${jobDescription} WHERE "id" = ${resume.id}`;
    }
  } catch (error) {
    console.error("Unable to save CV URL or job description to database:", error);
    // Don't throw an error here - we can continue without the CV URL stored
  }

  return resume;
}
