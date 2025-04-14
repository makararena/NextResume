import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EditorFormProps } from "@/lib/types";
import { generalInfoSchema, GeneralInfoValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import isEqual from "lodash/isEqual";

export default function GeneralInfoForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering GeneralInfoForm");
  console.log(`🧮 GeneralInfoForm render count: ${renderCount()}`);
  console.log("🚀 resumeData in GeneralInfoForm:", resumeData);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<GeneralInfoValues | null>(null);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues", {
      title: resumeData.title,
      description: resumeData.description,
    });
    return {
      title: resumeData.title || "",
      description: resumeData.description || "",
    };
  }, [resumeData.title, resumeData.description]);

  const form = useForm<GeneralInfoValues>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues,
  });

  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect triggered in GeneralInfoForm");

    const subscription = form.watch(async (values) => {
      console.log("👀 Form values changed:", values);
      
      // Don't proceed if the form is not filled out enough
      if (!values.title && !values.description) {
        console.log("⏭️ Skipping update - not enough form data");
        return;
      }

      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      const isValid = await form.trigger();
      console.log("✅ Form validation result:", isValid);
      if (!isValid) {
        console.log("⏭️ Skipping update - form invalid");
        return;
      }

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = { ...values };

      setResumeData((prevResumeData) => {
        const newData = { ...prevResumeData, ...values };

        console.log("🧩 setResumeData called in GeneralInfoForm");
        console.log("Prev data:", prevResumeData);
        console.log("New data:", newData);

        // Deep equality check to ensure we only update if there's an actual change
        if (!isEqual(prevResumeData.title, newData.title) || 
            !isEqual(prevResumeData.description, newData.description)) {
          console.log("✅ Data changed, updating state");
          return newData;
        } else {
          console.log("🚫 No data change detected");
          return prevResumeData;
        }
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in GeneralInfoForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">General info</h2>
        <p className="text-sm text-muted-foreground">
          This will not appear on your resume.
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="My cool resume" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="A resume for my next job" />
                </FormControl>
                <FormDescription>
                  Describe what this resume is for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
