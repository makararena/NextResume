import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Count user's resumes
    const count = await db.resume.count({
      where: {
        userId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching resume count:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch resume count" },
      { status: 500 }
    );
  }
} 