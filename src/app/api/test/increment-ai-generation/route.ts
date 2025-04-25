import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { incrementAiGenerationCount } from "@/lib/subscription";

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

    const success = await incrementAiGenerationCount(userId);
    
    if (!success) {
      return NextResponse.json(
        { error: "AI generation limit reached" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, message: "Test AI generation count incremented" });
  } catch (error) {
    console.error("Error incrementing test AI generation count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 