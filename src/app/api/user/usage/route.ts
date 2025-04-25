import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserUsage, getUserSubscriptionLevel } from "@/lib/subscription";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    
    // Return default values if not authenticated
    if (!userId) {
      return NextResponse.json({ resumeCount: 0, aiGenerationCount: 0, plan: 'free' });
    }

    try {
      // Get stored usage and subscription level
      const [usage, subscriptionLevel] = await Promise.all([
        getUserUsage(userId),
        getUserSubscriptionLevel(userId)
      ]);
      
      try {
        // Count actual resumes from database
        const actualResumeCount = await db.resume.count({
          where: { userId }
        });
        
        // Check if we need to update usage record
        let needsUpdate = false;
        let updatedData: { resumeCount?: number, aiGenerationCount?: number } = {};
        
        // Update resume count if actual count is different
        if (actualResumeCount !== usage.resumeCount) {
          needsUpdate = true;
          updatedData.resumeCount = actualResumeCount;
        }
        
        // Update the usage record if needed
        if (needsUpdate) {
          try {
            await db.userUsage.update({
              where: { userId },
              data: updatedData
            });
            
            // Return updated counts with subscription plan
            return NextResponse.json({
              resumeCount: updatedData.resumeCount ?? usage.resumeCount,
              aiGenerationCount: updatedData.aiGenerationCount ?? usage.aiGenerationCount,
              plan: subscriptionLevel
            });
          } catch (updateError) {
            console.error("Error updating usage record:", updateError);
            // Return the original usage data with subscription plan if update fails
            return NextResponse.json({
              ...usage,
              plan: subscriptionLevel
            });
          }
        }
        
        // Return usage with subscription plan
        return NextResponse.json({
          ...usage,
          plan: subscriptionLevel
        });
      } catch (countError) {
        console.error("Error counting resumes:", countError);
        // Return just the stored usage with subscription plan if counting fails
        return NextResponse.json({
          ...usage,
          plan: subscriptionLevel
        });
      }
    } catch (usageError) {
      console.error("Error getting user usage:", usageError);
      // Return default values if getting usage fails
      return NextResponse.json({ resumeCount: 0, aiGenerationCount: 0, plan: 'free' });
    }
  } catch (error) {
    console.error("Error in usage endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 