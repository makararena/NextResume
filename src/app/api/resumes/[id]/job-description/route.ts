import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract the resumeId from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const resumeId = pathParts[pathParts.length - 2]; // Assuming the path is /api/resumes/[id]/job-description
    
    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }
    
    // Fetch the resume with the job description
    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        userId, // Ensure the resume belongs to the authenticated user
      },
      select: {
        jobDescription: true,
      },
    });
    
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    
    return NextResponse.json({ jobDescription: resume.jobDescription || "" });
    
  } catch (error) {
    console.error("Error fetching job description:", error);
    return NextResponse.json(
      { error: "Failed to fetch job description" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Extract the resumeId from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const resumeId = pathParts[pathParts.length - 2]; // Assuming the path is /api/resumes/[id]/job-description
    
    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }
    
    // Find the resume first to verify it belongs to the user
    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        userId,
      },
    });
    
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    
    // Update the resume to set jobDescription to null
    await prisma.resume.update({
      where: {
        id: resumeId,
      },
      data: {
        jobDescription: null,
      },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting job description:", error);
    return NextResponse.json(
      { error: "Failed to delete job description" },
      { status: 500 }
    );
  }
} 