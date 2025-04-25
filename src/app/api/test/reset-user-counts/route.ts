import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Only allow in development or with explicit testing flag
    if (process.env.NODE_ENV !== 'development' && !process.env.ENABLE_TEST_FEATURES) {
      return NextResponse.json(
        { error: "Test endpoint unavailable in production" },
        { status: 403 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Reset user usage counts
    await db.userUsage.upsert({
      where: { userId },
      update: { 
        resumeCount: 0,
        aiGenerationCount: 0
      },
      create: { 
        userId, 
        resumeCount: 0, 
        aiGenerationCount: 0 
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "User usage counts reset to zero for testing" 
    });
  } catch (error) {
    console.error("Error resetting user counts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 