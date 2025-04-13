"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { env } from "@/env";
import prisma from "@/lib/prisma";
import { OpenAIClient } from "@/lib/openai";
import { parseDocumentText } from "@/lib/document-parser";
import { put } from "@vercel/blob";

// Initialize OpenAI client
const openai = new OpenAIClient();

// Generate AI resume action
export async function generateAIResume(formData: FormData) {
  // Get the authenticated user
  const session = await getSession();
  if (!session?.user?.email) {
    throw new Error("You must be logged in to generate a resume");
  }

  // Get the CV file and job description from the form
  const cvFile = formData.get("cv") as File;
  const jobDescription = formData.get("jobDescription") as string;
  const additionalInfo = formData.get("additionalInfo") as string;

  if (!cvFile || !jobDescription) {
    throw new Error("CV file and job description are required");
  }

  // Log the CV file details
  console.log("Generating resume from CV:", cvFile.name, cvFile.type, cvFile.size);

  try {
    // Upload the CV file to blob storage
    const timestamp = new Date().getTime();
    const filename = `${timestamp}-${cvFile.name}`;
    
    const blob = await put(filename, cvFile, {
      access: 'public',
    });
    
    console.log("Uploaded CV to blob storage:", blob.url);
    
    // Extract text from the CV file
    const documentText = await parseDocumentText(cvFile);
    console.log("Extracted text from CV");
    
    // Analyze the CV content using OpenAI
    const analyzedCvContent = await openai.analyzeDocument({
      documentText,
      fileName: cvFile.name,
      jobDescription,
      additionalInfo,
    });
    
    console.log("CV analyzed successfully");
    
    // Generate tailored resume using the analyzed CV content
    const generatedResume = await openai.generateResumeFromVisionAnalysis(
      analyzedCvContent,
      jobDescription,
      additionalInfo
    );
    
    console.log("Resume generated successfully");
    
    // Parse the generated resume JSON
    let resumeData;
    try {
      resumeData = JSON.parse(generatedResume);
    } catch (error) {
      console.error("Failed to parse generated resume JSON:", error);
      throw new Error("Failed to parse generated resume");
    }
    
    // Create the resume in the database
    const resumeTitle = resumeData.title || "Tailored Resume";
    
    // Check for duplicate titles
    const escapedTitle = resumeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`^${escapedTitle}(?: \\((\\d+)\\))?$`);
    
    const existingResumes = await prisma.resume.findMany({
      where: {
        userId: session.user.id,
        title: {
          startsWith: resumeTitle,
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
    const uniqueTitle = highestNumber > 0 
      ? `${resumeTitle} (${highestNumber + 1})` 
      : resumeTitle;
    
    const resume = await prisma.resume.create({
      data: {
        title: uniqueTitle,
        summary: resumeData.summary || "",
        firstName: resumeData.firstName || "",
        lastName: resumeData.lastName || "",
        email: resumeData.email || session.user.email,
        phone: resumeData.phone || "",
        jobTitle: resumeData.jobTitle || "",
        city: resumeData.city || "",
        country: resumeData.country || "",
        cvUrl: blob.url,
        jobDescription,
        additionalInfo,
        userId: session.user.id,
        workExperiences: {
          create: resumeData.workExperiences?.map((exp: any) => ({
            position: exp.position,
            company: exp.company,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            description: exp.description,
          })) || [],
        },
        educations: {
          create: resumeData.educations?.map((edu: any) => ({
            degree: edu.degree,
            school: edu.school,
            startDate: new Date(edu.startDate),
            endDate: new Date(edu.endDate),
          })) || [],
        },
        skills: {
          create: resumeData.skills?.map((skill: string) => ({
            name: skill,
          })) || [],
        },
      },
    });
    
    console.log("Resume created in database:", resume.id);
    
    // Revalidate the resumes page
    revalidatePath("/resumes");
    
    // Redirect to the resume page
    redirect(`/resumes/${resume.id}`);
  } catch (error) {
    console.error("Failed to generate resume:", error);
    throw new Error(`Failed to generate resume: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
} 