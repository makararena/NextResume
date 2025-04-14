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
import { summarySchema, SummaryValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import GenerateSummaryButton from "./GenerateSummaryButton";
import isEqual from "lodash/isEqual";

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
  
  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in SummaryForm");
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in SummaryForm:", values);
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = { ...values };
      
      // Validate the form
      form.trigger().then(isValid => {
        console.log("✅ Form validation result:", isValid);
        if (!isValid) {
          console.log("⏭️ Skipping update - form invalid");
          return;
        }

        setResumeData((prevResumeData) => {
          const newData = { ...prevResumeData, ...values };

          console.log("🧩 setResumeData called in SummaryForm");
          
          // Deep equality check to ensure we only update if there's an actual change
          if (!isEqual(prevResumeData.summary, newData.summary)) {
            console.log("✅ Data changed in SummaryForm, updating state");
            return newData;
          } else {
            console.log("🚫 No data change detected in SummaryForm");
            return prevResumeData;
          }
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in SummaryForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Professional summary</h2>
        <p className="text-sm text-muted-foreground">
          Write a short introduction for your resume or let the AI generate one
          from your entered data.
        </p>
      </div>
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
