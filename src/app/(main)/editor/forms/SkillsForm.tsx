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
import { ResumeValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import isEqual from "lodash/isEqual";
import debounce from "lodash/debounce";

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
  
  // Reset form when defaultValues change FROM OUTSIDE (not from our own updates)
  useEffect(() => {
    // Only reset if the incoming defaults really differ from what
    // the user currently has in the form
    if (!isEqual(defaultValues, form.getValues())) {
      form.reset(defaultValues);
    }
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in SkillsForm");
    
    // Create a debounced version of the update function
    const debouncedUpdate = debounce((values: any) => {
      console.log("👀 Debounced form values update in SkillsForm");
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = { 
        skills: [] // Will be updated after processing
      };
      
      // Process skills to remove empty entries
      const processedSkills = values.skills
        ?.filter((skill: any): skill is string => skill !== undefined)
        .map((skill: string) => skill.trim())
        .filter((skill: string) => skill !== "") || [];
      
      // Update stored values with processed skills
      prevFormValuesRef.current = { 
        skills: processedSkills 
      };

      setResumeData((prevResumeData: ResumeValues) => {
        const newData: ResumeValues = { 
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
    }, 500); // 500ms debounce
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in SkillsForm");
      // Debounce the update to prevent focus issues
      debouncedUpdate(values);
    });

    return () => {
      console.log("🧹 Cleaning up subscription in SkillsForm");
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
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Skills</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    id="skills-textarea"
                    key="skills-textarea"
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
