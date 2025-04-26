"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedbackButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="fixed bottom-4 right-4 shadow-md bg-background hover:bg-background/90 z-50 flex items-center gap-2"
      asChild
    >
      <a href="mailto:naulichtis@gmail.com?subject=NextResume Issue Report" target="_blank" rel="noopener noreferrer">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span>Have any issues?</span>
      </a>
    </Button>
  );
} 