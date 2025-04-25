import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Testing endpoint to modify subscription status
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
    const type = url.searchParams.get("type");

    if (!type || (type !== "free" && type !== "premium")) {
      return NextResponse.json(
        { error: "Invalid subscription type. Use 'free' or 'premium'." },
        { status: 400 }
      );
    }

    // Update or create UserSubscription record for this user
    await prisma.userSubscription.upsert({
      where: { userId: userId },
      update: {
        plan: type,
        stripeCurrentPeriodEnd: type === "premium" 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null,
        stripeCancelAtPeriodEnd: false
      },
      create: {
        userId: userId,
        plan: type,
        stripeCurrentPeriodEnd: type === "premium" 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null
      },
    });

    // Also ensure there's a UserUsage record
    await prisma.userUsage.upsert({
      where: { userId: userId },
      update: {},
      create: {
        userId: userId,
        resumeCount: 0,
        aiGenerationCount: 0
      }
    });

    // Return to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Error updating subscription for testing:", error);
    return NextResponse.json(
      { error: "Failed to update subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 