"use server";

import { canCreateResume, canUseCustomizations } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { getUserSubscriptionLevel } from "@/lib/subscription";
import { resumeSchema, ResumeValues } from "@/lib/validation";
import { auth } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  mapToResumeValues,
  formatDateYYYMMDD,
  getFileNameWithoutExtension,
} from "@/lib/utils";
import openai from "@/lib/openai";
import { canUseAITools } from "@/lib/permissions";

export async function saveResume(values: ResumeValues) {
  const { id } = values;

  console.log("🚀 SERVER: saveResume called with ID:", id);
  console.time("⏱️ SERVER: Total saveResume duration");

  try {
    console.log("SERVER: received values", JSON.stringify(values, null, 2).substring(0, 500) + "...");

    console.time("⏱️ SERVER: Schema validation");
    const { photo, workExperiences, educations, ...resumeValues } =
      resumeSchema.parse(values);
    console.timeEnd("⏱️ SERVER: Schema validation");

    console.time("⏱️ SERVER: Auth check");
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }
    console.timeEnd("⏱️ SERVER: Auth check");

    console.time("⏱️ SERVER: Subscription check");
    const subscriptionLevel = await getUserSubscriptionLevel(userId);

    if (!id) {
      const resumeCount = await prisma.resume.count({ where: { userId } });

      if (!canCreateResume(subscriptionLevel, resumeCount)) {
        throw new Error(
          "Maximum resume count reached for this subscription level",
        );
      }
    }
    console.timeEnd("⏱️ SERVER: Subscription check");

    console.time("⏱️ SERVER: Resume existence check");
    const existingResume = id
      ? await prisma.resume.findUnique({ where: { id, userId } })
      : null;

    if (id && !existingResume) {
      throw new Error("Resume not found");
    }
    console.timeEnd("⏱️ SERVER: Resume existence check");

    console.time("⏱️ SERVER: Customizations check");
    const hasCustomizations =
      (resumeValues.borderStyle &&
        resumeValues.borderStyle !== existingResume?.borderStyle) ||
      (resumeValues.colorHex &&
        resumeValues.colorHex !== existingResume?.colorHex);

    if (hasCustomizations && !canUseCustomizations(subscriptionLevel)) {
      throw new Error("Customizations not allowed for this subscription level");
    }
    console.timeEnd("⏱️ SERVER: Customizations check");

    console.time("⏱️ SERVER: Photo handling");
    let newPhotoUrl: string | undefined | null = undefined;

    if (photo instanceof File) {
      console.log("SERVER: Processing photo upload, size:", photo.size);
      if (existingResume?.photoUrl) {
        await del(existingResume.photoUrl);
      }

      const blob = await put(`resume_photos/${path.extname(photo.name)}`, photo, {
        access: "public",
      });

      newPhotoUrl = blob.url;
      console.log("SERVER: Photo uploaded to URL:", newPhotoUrl);
    } else if (photo === null) {
      if (existingResume?.photoUrl) {
        await del(existingResume.photoUrl);
      }
      newPhotoUrl = null;
      console.log("SERVER: Photo removed");
    }
    console.timeEnd("⏱️ SERVER: Photo handling");

    console.time("⏱️ SERVER: Database operation");
    let result;
    if (id) {
      console.log("SERVER: Updating existing resume");
      result = await prisma.resume.update({
        where: { id },
        data: {
          ...resumeValues,
          photoUrl: newPhotoUrl,
          workExperiences: {
            deleteMany: {},
            create: workExperiences?.map((exp) => ({
              ...exp,
              startDate: exp.startDate ? new Date(exp.startDate) : undefined,
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            })),
          },
          educations: {
            deleteMany: {},
            create: educations?.map((edu) => ({
              ...edu,
              startDate: edu.startDate ? new Date(edu.startDate) : undefined,
              endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            })),
          },
          updatedAt: new Date(),
        },
      });
      console.log("SERVER: Resume updated successfully");
    } else {
      console.log("SERVER: Creating new resume");
      result = await prisma.resume.create({
        data: {
          ...resumeValues,
          userId,
          photoUrl: newPhotoUrl,
          workExperiences: {
            create: workExperiences?.map((exp) => ({
              ...exp,
              startDate: exp.startDate ? new Date(exp.startDate) : undefined,
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            })),
          },
          educations: {
            create: educations?.map((edu) => ({
              ...edu,
              startDate: edu.startDate ? new Date(edu.startDate) : undefined,
              endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            })),
          },
        },
      });
      console.log("SERVER: New resume created successfully");
    }
    console.timeEnd("⏱️ SERVER: Database operation");

    console.timeEnd("⏱️ SERVER: Total saveResume duration");
    return result;
  } catch (error) {
    console.timeEnd("⏱️ SERVER: Total saveResume duration");
    console.error("❌ SERVER: Error in saveResume:", error);
    throw error;
  }
}

// Generate cover letter based on the resume data and job description
export async function generateCoverLetter(
  resumeId: string,
  jobDescription: string,
  additionalInfo?: string
): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  const subscriptionLevel = await getUserSubscriptionLevel(userId);
  
  if (!canUseAITools(subscriptionLevel)) {
    throw new Error("Upgrade your subscription to use this feature");
  }
  
  try {
    // Fetch the resume data
    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        userId,
      },
      include: {
        workExperiences: true,
        educations: true,
      },
    });
    
    if (!resume) {
      throw new Error("Resume not found");
    }
    
    // Convert to ResumeValues format
    const resumeData = mapToResumeValues(resume);
    
    // Generate the cover letter using the user-provided job description
    const coverLetter = await openai.generateCoverLetter(
      resumeData,
      jobDescription,
      additionalInfo
    );
    
    return coverLetter;
  } catch (error) {
    console.error("Cover letter generation error:", error);
    throw new Error(`Failed to generate cover letter: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Generate HR message based on the resume data and job description
export async function generateHRMessage(
  resumeId: string,
  jobDescription: string,
  recruiterName: string,
  additionalInfo?: string
): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  const subscriptionLevel = await getUserSubscriptionLevel(userId);
  
  if (!canUseAITools(subscriptionLevel)) {
    throw new Error("Upgrade your subscription to use this feature");
  }
  
  try {
    // Fetch the resume data
    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        userId,
      },
      include: {
        workExperiences: true,
        educations: true,
      },
    });
    
    if (!resume) {
      throw new Error("Resume not found");
    }
    
    // Convert to ResumeValues format
    const resumeData = mapToResumeValues(resume);
    
    // Generate the HR message using the user-provided job description and recruiter name
    const hrMessage = await openai.generateHRMessage(
      resumeData,
      jobDescription,
      recruiterName,
      additionalInfo
    );
    
    return hrMessage;
  } catch (error) {
    console.error("HR message generation error:", error);
    throw new Error(`Failed to generate HR message: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
