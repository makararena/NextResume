"use client";

import { Button } from "@/components/ui/button";
import { PlusSquare } from "lucide-react";
import { useState } from "react";
import ModeSelectionDialog from "@/components/ModeSelectionDialog";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

export default function CreateResumeButton() {
  const [showModeDialog, setShowModeDialog] = useState(false);
  const { canCreateResume, showUpgradeMessage } = useSubscriptionLimits();
  const { toast } = useToast();
  
  const handleClick = () => {
    if (canCreateResume()) {
      setShowModeDialog(true);
    } else {
      showUpgradeMessage("resume");
    }
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button 
                className="gap-1.5 h-8 text-xs" 
                size="sm" 
                onClick={handleClick}
                variant={canCreateResume() ? "default" : "outline"}
                disabled={!canCreateResume()}
              >
                <PlusSquare className="h-3 w-3" />
                New resume
              </Button>
            </div>
          </TooltipTrigger>
          {!canCreateResume() && (
            <TooltipContent className="max-w-xs p-3">
              <p>You've reached your free resumes limit. <Link href="/dashboard" className="text-primary underline">Upgrade to premium</Link> for unlimited resumes.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      <ModeSelectionDialog 
        open={showModeDialog} 
        onOpenChange={setShowModeDialog} 
      />
    </>
  );
}
