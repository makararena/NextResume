"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileEdit, AlertTriangle } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

export default function ModeSelectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { canUseAIGeneration, showUpgradeMessage } = useSubscriptionLimits();
  
  const handleManualMode = () => {
    onOpenChange(false);
    router.push("/editor");
  };
  
  const handleAIMode = () => {
    if (canUseAIGeneration()) {
      onOpenChange(false);
      router.push("/editor/ai-mode");
    } else {
      showUpgradeMessage("ai");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Select Resume Creation Method</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Choose how you want to create your resume
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2">
          <Card className="flex flex-col border-2 hover:border-primary hover:shadow-md cursor-pointer transition-all" onClick={handleManualMode}>
            <CardHeader className="p-4">
              <div className="mx-auto mb-1.5 rounded-full bg-primary/10 p-1.5">
                <FileEdit className="size-6 text-primary" />
              </div>
              <CardTitle className="text-center text-base">Manual Mode</CardTitle>
              <CardDescription className="text-center text-xs">
                Create your resume using our editor interface
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-0 pb-4">
              <Button variant="outline" onClick={handleManualMode} size="sm" className="text-xs h-8">Start Manual</Button>
            </CardFooter>
          </Card>
          
          <Card 
            className={`flex flex-col border-2 ${canUseAIGeneration() ? 'hover:border-primary hover:shadow-md cursor-pointer' : 'border-muted bg-muted/30 opacity-70'} transition-all`} 
            onClick={canUseAIGeneration() ? handleAIMode : undefined}
          >
            <CardHeader className="p-4 relative">
              {!canUseAIGeneration() && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px]"
                >
                  <AlertTriangle className="h-2 w-2 mr-0.5" />
                  Limit Reached
                </Badge>
              )}
              <div className="mx-auto mb-1.5 rounded-full bg-primary/10 p-1.5">
                <Brain className="size-6 text-primary" />
              </div>
              <CardTitle className="text-center text-base">AI Mode</CardTitle>
              <CardDescription className="text-center text-xs">
                Optimize your resume for specific job requirements
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-0 pb-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="outline" 
                        onClick={handleAIMode} 
                        size="sm" 
                        className="text-xs h-8" 
                        disabled={!canUseAIGeneration()}
                      >
                        Start AI
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!canUseAIGeneration() && (
                    <TooltipContent className="max-w-xs p-3">
                      <p>You have reached your AI generation limit. <Link href="/dashboard" className="text-primary underline">Upgrade to Premium</Link> for unlimited AI optimizations.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 