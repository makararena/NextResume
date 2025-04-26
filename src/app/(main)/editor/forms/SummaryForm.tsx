import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { EditorFormProps } from "@/lib/types";
import { summarySchema, SummaryValues, ResumeValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import GenerateSummaryButton from "./GenerateSummaryButton";
import isEqual from "lodash/isEqual";
import debounce from "lodash/debounce";

export default function SummaryForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count for debugging
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering SummaryForm");
  console.log(`🧮 SummaryForm render count: ${renderCount()}`);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<SummaryValues | null>(null);
  // Track currently focused element
  const activeElementRef = useRef<Element | null>(null);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues for SummaryForm");
    return {
      summary: resumeData.summary || "",
    };
  }, [resumeData.summary]);

  const form = useForm<SummaryValues>({
    resolver: zodResolver(summarySchema),
    defaultValues,
  });
  
  // Reset form when defaultValues change FROM OUTSIDE (not from our own updates)
  useEffect(() => {
    // Only reset if the incoming defaults really differ from what
    // the user currently has in the form
    if (!isEqual(defaultValues, form.getValues())) {
      form.reset(defaultValues);
    }
  }, [form, defaultValues]);

  // Save active element before updates to restore focus later
  useEffect(() => {
    const saveActiveElement = () => {
      activeElementRef.current = document.activeElement;
    };

    // Add event listeners to capture the active element before blur
    document.addEventListener('focusin', saveActiveElement);
    
    return () => {
      document.removeEventListener('focusin', saveActiveElement);
    };
  }, []);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in SummaryForm");
    
    // Create a debounced version of the update function
    const debouncedUpdate = debounce((values: any) => {
      console.log("👀 Debounced form values update in SummaryForm");
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      // Store active element before update
      const activeElement = activeElementRef.current;
      const activeId = activeElement instanceof HTMLElement ? activeElement.id : null;

      // Clean up the summary value
      const processedValues = {
        summary: values.summary?.trim() || ""
      };

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = JSON.parse(JSON.stringify(processedValues));
      
      setResumeData((prevResumeData: ResumeValues) => {
        const newData: ResumeValues = { 
          ...prevResumeData, 
          ...processedValues 
        };

        console.log("🧩 setResumeData called in SummaryForm");
        
        // Always update state when form data changes
        // This ensures autosave is triggered properly
        return newData;
      });
      
      // Restore focus after state update using a small delay
      setTimeout(() => {
        if (activeId) {
          const elementToFocus = document.getElementById(activeId);
          if (elementToFocus && elementToFocus instanceof HTMLElement) {
            elementToFocus.focus();
          }
        }
      }, 10);
    }, 300); // Shorter debounce time for better responsiveness
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in SummaryForm");
      // Debounce the update to prevent focus issues
      debouncedUpdate(values);
    });

    return () => {
      console.log("🧹 Cleaning up subscription in SummaryForm");
      debouncedUpdate.cancel();
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Professional summary</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    id="summary-textarea"
                    key="summary-textarea"
                    placeholder="A brief, engaging text about yourself"
                    className="min-h-[240px]"
                  />
                </FormControl>
                <FormMessage />
                <GenerateSummaryButton
                  resumeData={resumeData}
                  onSummaryGenerated={(summary) =>
                    form.setValue("summary", summary)
                  }
                />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
