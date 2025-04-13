"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileEdit } from "lucide-react";

export default function ModeSelectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  
  const handleManualMode = () => {
    onOpenChange(false);
    router.push("/editor");
  };
  
  const handleAIMode = () => {
    onOpenChange(false);
    router.push("/editor/ai-mode");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Choose Resume Creation Mode</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Select how you would like to create your new resume
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
                Build your resume step by step using our editor
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-0 pb-4">
              <Button variant="outline" onClick={handleManualMode} size="sm" className="text-xs h-8">Start Manual</Button>
            </CardFooter>
          </Card>
          
          <Card className="flex flex-col border-2 hover:border-primary hover:shadow-md cursor-pointer transition-all" onClick={handleAIMode}>
            <CardHeader className="p-4">
              <div className="mx-auto mb-1.5 rounded-full bg-primary/10 p-1.5">
                <Brain className="size-6 text-primary" />
              </div>
              <CardTitle className="text-center text-base">AI Mode</CardTitle>
              <CardDescription className="text-center text-xs">
                Upload your CV and job description for AI-optimized resume
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-0 pb-4">
              <Button variant="outline" onClick={handleAIMode} size="sm" className="text-xs h-8">Start AI</Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 