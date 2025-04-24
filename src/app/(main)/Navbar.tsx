"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { UserButton, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSubscriptionLevel } from "./SubscriptionLevelProvider";
import { Button } from "@/components/ui/button";
import { CreditCard, Crown, FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FREE_TIER_LIMITS } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { theme } = useTheme();
  const subscriptionLevel = useSubscriptionLevel();
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const isPremium = subscriptionLevel === "premium";
  
  const [userUsage, setUserUsage] = useState<{ resumeCount: number; aiGenerationCount: number }>({ 
    resumeCount: 0, 
    aiGenerationCount: 0 
  });
  
  // Add state to track client-side rendering
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch user usage data
  useEffect(() => {
    // Only fetch if auth is loaded and we have a userId
    if (!isLoaded || !userId) return;
    
    const fetchUsage = async () => {
      try {
        console.log("Fetching user usage data...");
        const response = await fetch("/api/user/usage", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensure cookies are sent with the request
          cache: "no-store"
        });
        
        // Handle any status gracefully
        const usageData = await response.json();
        console.log("User usage data:", usageData);
        
        // Only update if we have valid usage data
        if (usageData && typeof usageData.resumeCount === 'number') {
          setUserUsage(usageData);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
        // Just continue with default values on error
      }
    };
    
    fetchUsage();
    
    // Set up interval to refresh usage data every 30 seconds
    const intervalId = setInterval(fetchUsage, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isLoaded, userId, pathname]);

  return (
    <header className="shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 p-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Next</span>
            <span className="text-foreground">Resume</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!isPremium && isLoaded && userId && (
            <div className="hidden md:flex items-center gap-3 border-r pr-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="font-medium">{userUsage.resumeCount}/{FREE_TIER_LIMITS.MAX_RESUMES}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resume Projects</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="font-medium">{userUsage.aiGenerationCount}/{FREE_TIER_LIMITS.MAX_AI_GENERATIONS}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI Generations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          <Link href="/dashboard">
            <Button 
              variant={isPremium ? "premium" : "outline"} 
              size="sm" 
              className="gap-2"
            >
              {isPremium ? (
                <Crown className="h-4 w-4" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isPremium ? "Premium" : "Free Plan"}
            </Button>
          </Link>
          <ThemeToggle />
          {/* Only render UserButton on the client side */}
          {isMounted && (
            <UserButton
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: {
                    width: 35,
                    height: 35,
                  },
                },
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
