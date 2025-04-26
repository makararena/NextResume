"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSubscriptionLevel } from "../SubscriptionLevelProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText, Sparkles, PaintBucket, Zap, Crown, X, ArrowLeft } from "lucide-react";
import { FREE_TIER_LIMITS } from "@/lib/subscription";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionLevel = useSubscriptionLevel();
  const [userUsage, setUserUsage] = useState<{ resumeCount: number; aiGenerationCount: number }>({ 
    resumeCount: 0, 
    aiGenerationCount: 0 
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check for success or canceled from Stripe redirect
  useEffect(() => {
    // Check for success from Stripe redirect
    if (searchParams.get("success")) {
      toast({
        title: "Subscription successful!",
        description: "Your premium subscription is now active.",
        duration: 5000,
      });
    }
    
    // Check for cancellation from Stripe redirect
    try {
      if (searchParams.get("canceled")) {
        toast({
          title: "Subscription canceled",
          description: "You can still upgrade anytime.",
          duration: 5000,
        });
        
        // Remove the canceled parameter from URL to prevent repeated errors
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("canceled");
        window.history.replaceState({}, "", newUrl.toString());
      }
    } catch (error) {
      console.error("Error handling canceled parameter:", error);
      // Still clean up the URL to prevent further errors
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("canceled");
        window.history.replaceState({}, "", newUrl.toString());
      } catch (e) {
        console.error("Failed to clean up URL:", e);
      }
    }
  }, [searchParams, toast]);
  
  // Fetch user usage data
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/user/usage");
        if (!response.ok) {
          throw new Error("Failed to fetch usage data");
        }
        const usageData = await response.json();
        setUserUsage(usageData);
      } catch (error) {
        console.error("Error fetching usage:", error);
      }
    };
    
    fetchUsage();
  }, []);
  
  const handleUpgradeClick = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast({
        title: "Error",
        description: "Failed to access billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-muted-foreground hover:text-foreground" 
          onClick={() => router.push("/resumes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <div className="text-center mb-10 max-w-lg">
        <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your resume needs
        </p>
      </div>
      
      <div className="w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="h-full border">
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-1.5">
                <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
                <CardDescription className="text-base">
                Create and edit your resume with essential features — perfect for getting started quickly and easily.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pb-0">
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="text-4xl font-bold tracking-tight">$0</p>
                  <p className="text-muted-foreground mt-1">/month</p>
                </div>
                
                <Button 
                  onClick={() => router.push("/resumes")} 
                  className="w-full py-6 text-base" 
                  variant="outline"
                >
                  View your resumes
                </Button>
              </div>
            </CardContent>
            
            <div className="p-6">
              <h3 className="font-semibold mb-4">Features you'll love:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{FREE_TIER_LIMITS.MAX_RESUMES} resume projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{FREE_TIER_LIMITS.MAX_AI_GENERATIONS} AI generations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Manual resume editing</span>
                </li>
                <li className="flex items-start opacity-50">
                  <X className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority features</span>
                </li>
              </ul>
            </div>
          </Card>
          
          {/* Premium Plan */}
          <Card className="h-full relative border-2 border-primary/50 bg-primary/[0.03] overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Badge className="bg-primary/90 hover:bg-primary px-3 py-1.5">
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                Recommended
              </Badge>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-1.5">
                <CardTitle className="text-2xl font-bold">Premium Plan</CardTitle>
                <CardDescription className="text-base">
                  Access comprehensive resume optimization tools and unlimited usage capabilities.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pb-0">
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="text-4xl font-bold tracking-tight">$9.99</p>
                  <p className="text-muted-foreground mt-1">/month</p>
                </div>
                
                {subscriptionLevel === "premium" ? (
                  <Button 
                    onClick={handleManageSubscription} 
                    className="w-full py-6 text-base"
                    disabled={isLoading}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpgradeClick} 
                    className="w-full py-6 text-base" 
                    disabled={isLoading}
                  >
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </CardContent>
            
            <div className="p-6">
              <h3 className="font-semibold mb-4">Premium Features:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited resume projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited AI generations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Regular updates and improvements</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 