import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { EditorFormProps } from "@/lib/types";
import { skillsSchema, SkillsValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import isEqual from "lodash/isEqual";

export default function SkillsForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count for debugging
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering SkillsForm");
  console.log(`🧮 SkillsForm render count: ${renderCount()}`);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<SkillsValues | null>(null);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues for SkillsForm");
    return {
      skills: resumeData.skills || [],
    };
  }, [resumeData.skills]);

  const form = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues,
  });
  
  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in SkillsForm");
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in SkillsForm:", values);
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = { 
        skills: [] // Will be updated after processing
      };
      
      // Validate the form
      form.trigger().then(isValid => {
        console.log("✅ Form validation result:", isValid);
        if (!isValid) {
          console.log("⏭️ Skipping update - form invalid");
          return;
        }

        // Process skills to remove empty entries
        const processedSkills = values.skills
          ?.filter((skill): skill is string => skill !== undefined)
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "") || [];
        
        // Update stored values with processed skills
        prevFormValuesRef.current = { 
          skills: processedSkills 
        };

        setResumeData((prevResumeData) => {
          const newData = { 
            ...prevResumeData, 
            skills: processedSkills 
          };

          console.log("🧩 setResumeData called in SkillsForm");
          
          // Deep equality check to ensure we only update if there's an actual change
          if (!isEqual(prevResumeData.skills, newData.skills)) {
            console.log("✅ Data changed in SkillsForm, updating state");
            return newData;
          } else {
            console.log("🚫 No data change detected in SkillsForm");
            return prevResumeData;
          }
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in SkillsForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Skills</h2>
        <p className="text-sm text-muted-foreground">What are you good at?</p>
      </div>
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Skills</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g. React.js, Node.js, graphic design, ..."
                    onChange={(e) => {
                      const skills = e.target.value.split(",");
                      field.onChange(skills);
                    }}
                    className="min-h-[240px]"
                  />
                </FormControl>
                <FormDescription>
                  Separate each skill with a comma.
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
