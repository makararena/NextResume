import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUserIcon, PenLineIcon } from "lucide-react";

interface FooterProps {
  showSmResumePreview: boolean;
  setShowSmResumePreview: (show: boolean) => void;
  className?: string;
}

export default function Footer({
  showSmResumePreview,
  setShowSmResumePreview,
  className,
}: FooterProps) {
  return (
    <footer className={cn("w-full border-t border-border bg-card px-3 py-5", className)}>
      <div className="mx-auto flex max-w-7xl justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSmResumePreview(!showSmResumePreview)}
          className="md:hidden"
          title={
            showSmResumePreview ? "Show input form" : "Show resume preview"
          }
        >
          {showSmResumePreview ? <PenLineIcon /> : <FileUserIcon />}
        </Button>
      </div>
    </footer>
  );
}
