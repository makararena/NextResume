import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { incrementAiGenerationCount } from "@/lib/subscription";

export async function POST() {
  try {
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing AI generation count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 