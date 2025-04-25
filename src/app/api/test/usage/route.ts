import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Testing endpoint to modify usage counts
 * This should only be used in development mode
 */
export async function GET(req: NextRequest) {
  // Safety check - only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    // Get auth data properly with await
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const reset = url.searchParams.get("reset") === "true";
    const resumes = url.searchParams.get("resumes");
    const ai = url.searchParams.get("ai");

    // Find existing user usage record
    const userUsage = await prisma.userUsage.findUnique({
      where: { userId: userId },
    });

    // Set the usage counts
    const resumeCount = reset ? 0 : resumes ? parseInt(resumes, 10) : userUsage?.resumeCount || 0;
    const aiGenerationCount = reset ? 0 : ai ? parseInt(ai, 10) : userUsage?.aiGenerationCount || 0;

    // Update or create the usage record
    await prisma.userUsage.upsert({
      where: { userId: userId },
      update: {
        resumeCount,
        aiGenerationCount,
      },
      create: {
        userId: userId,
        resumeCount,
        aiGenerationCount,
      },
    });

    // Return to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Error updating usage for testing:", error);
    return NextResponse.json(
      { error: "Failed to update usage counts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 