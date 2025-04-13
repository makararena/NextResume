"use client";

import { Button } from "@/components/ui/button";
import { PlusSquare } from "lucide-react";
import { useState } from "react";
import ModeSelectionDialog from "@/components/ModeSelectionDialog";

export default function CreateResumeButton() {
  const [showModeDialog, setShowModeDialog] = useState(false);
  
  return (
    <>
      <Button 
        className="gap-1.5 h-8 text-xs" 
        size="sm" 
        onClick={() => setShowModeDialog(true)}
        variant="default"
      >
        <PlusSquare className="h-3 w-3" />
        New resume
      </Button>
      
      <ModeSelectionDialog 
        open={showModeDialog} 
        onOpenChange={setShowModeDialog} 
      />
    </>
  );
}
