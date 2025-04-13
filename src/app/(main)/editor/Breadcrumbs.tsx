import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { steps } from "./steps";
import React from "react";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  className?: string;
}

export default function Breadcrumbs({
  currentStep,
  setCurrentStep,
  className,
}: BreadcrumbsProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Breadcrumb className="overflow-x-auto whitespace-nowrap">
        <BreadcrumbList className="flex-nowrap">
          {steps.map((step) => (
            <React.Fragment key={step.key}>
              <BreadcrumbItem className="flex-shrink-0">
                {step.key === currentStep ? (
                  <BreadcrumbPage className="font-medium text-sm py-1 px-2 bg-primary/10 rounded">
                    {step.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button 
                      onClick={() => setCurrentStep(step.key)}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline py-1 px-2"
                    >
                      {step.title}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="last:hidden mx-0.5 flex-shrink-0" />
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
