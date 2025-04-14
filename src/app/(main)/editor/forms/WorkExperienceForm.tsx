import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { EditorFormProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { workExperienceSchema, WorkExperienceValues, WorkExperience } from "@/lib/validation";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import isEqual from "lodash/isEqual";
import GenerateWorkExperienceButton from "./GenerateWorkExperienceButton";

export default function WorkExperienceForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count for debugging
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering WorkExperienceForm");
  console.log(`🧮 WorkExperienceForm render count: ${renderCount()}`);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<WorkExperienceValues | null>(null);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues for WorkExperienceForm");
    
    // Make sure all workExperiences fields are properly initialized
    const sanitizedExperiences = (resumeData.workExperiences || []).map(exp => ({
      position: exp.position || "",
      company: exp.company || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || ""
    }));
    
    return {
      workExperiences: sanitizedExperiences,
    };
  }, [resumeData.workExperiences]);

  const form = useForm<WorkExperienceValues>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues,
  });
  
  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in WorkExperienceForm");
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in WorkExperienceForm:", values);
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }
      
      // Validate the form
      form.trigger().then(isValid => {
        console.log("✅ Form validation result:", isValid);
        if (!isValid) {
          console.log("⏭️ Skipping update - form invalid");
          return;
        }
        
        // Process experiences to filter out undefined values
        const processedExperiences = values.workExperiences?.filter((exp) => exp !== undefined) || [];
        
        // Store current values to prevent future duplicate processing
        prevFormValuesRef.current = { 
          workExperiences: processedExperiences 
        };
        
        setResumeData((prevData) => {
          const newData = { 
            ...prevData, 
            workExperiences: processedExperiences
          };
          
          console.log("🧩 setResumeData called in WorkExperienceForm");
          
          // Deep equality check to ensure we only update if there's an actual change
          if (!isEqual(prevData.workExperiences, newData.workExperiences)) {
            console.log("✅ Data changed in WorkExperienceForm, updating state");
            return newData;
          } else {
            console.log("🚫 No data change detected in WorkExperienceForm");
            return prevData;
          }
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in WorkExperienceForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "workExperiences",
    keyName: "fieldId",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.fieldId === active.id);
      const newIndex = fields.findIndex((field) => field.fieldId === over.id);
      move(oldIndex, newIndex);
      return arrayMove(fields, oldIndex, newIndex);
    }
  }
  
  // Handler for AI-generated work experience
  const handleWorkExperienceGenerated = (workExperience: WorkExperience) => {
    console.log("🤖 Adding AI-generated work experience:", workExperience);
    try {
      append({
        position: workExperience.position || "",
        company: workExperience.company || "",
        startDate: workExperience.startDate || "",
        endDate: workExperience.endDate || "",
        description: workExperience.description || "",
      });
      
      // Force form to recognize the new field
      setTimeout(() => {
        form.trigger();
      }, 0);
    } catch (error) {
      console.error("Error adding AI-generated work experience:", error);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Work experience</h2>
        <p className="text-sm text-muted-foreground">
          Add as many work experiences as you like.
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={fields}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field, index) => (
                <WorkExperienceItem
                  id={field.fieldId}
                  key={field.fieldId}
                  index={index}
                  form={form}
                  remove={remove}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              onClick={() => {
                console.log("➕ Adding new work experience");
                try {
                  append({
                    position: "",
                    company: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  });
                  // Force form to recognize the new field
                  setTimeout(() => {
                    form.trigger();
                  }, 0);
                } catch (error) {
                  console.error("Error adding work experience:", error);
                }
              }}
            >
              Add work experience
            </Button>
            <GenerateWorkExperienceButton 
              onWorkExperienceGenerated={handleWorkExperienceGenerated}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}

interface WorkExperienceItemProps {
  id: string;
  form: UseFormReturn<WorkExperienceValues>;
  index: number;
  remove: (index: number) => void;
}

function WorkExperienceItem({
  id,
  form,
  index,
  remove,
}: WorkExperienceItemProps) {
  console.log(`🧩 Rendering WorkExperienceItem ${index + 1}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Safe handler for removing work experience
  const handleRemove = () => {
    console.log(`❌ Removing work experience at index ${index}`);
    try {
      // Use a timeout to avoid React state update conflicts
      setTimeout(() => {
        remove(index);
      }, 0);
    } catch (error) {
      console.error("Error removing work experience:", error);
    }
  };

  // Safely handle date values
  const getDateValue = (value: any) => {
    if (!value) return "";
    if (typeof value === 'string' && value.length >= 10) {
      return value.slice(0, 10);
    }
    return "";
  };

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border bg-background p-3",
        isDragging && "relative z-50 cursor-grab shadow-xl",
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex justify-between gap-2">
        <span className="font-semibold">Work experience {index + 1}</span>
        <div className="flex items-center gap-1">
          <GripHorizontal
            className="size-5 cursor-grab text-muted-foreground focus:outline-none"
            {...attributes}
            {...listeners}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-destructive"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove();
            }}
          >
            Remove
          </Button>
        </div>
      </div>
      <FormField
        control={form.control}
        name={`workExperiences.${index}.position`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job title</FormLabel>
            <FormControl>
              <Input {...field} autoFocus={index === 0} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`workExperiences.${index}.company`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name={`workExperiences.${index}.startDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={getDateValue(field.value)}
                  onChange={(e) => {
                    field.onChange(e.target.value || "");
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`workExperiences.${index}.endDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={getDateValue(field.value)}
                  onChange={(e) => {
                    field.onChange(e.target.value || "");
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormDescription>
        Leave <span className="font-semibold">end date</span> empty if you are
        currently working here.
      </FormDescription>
      <FormField
        control={form.control}
        name={`workExperiences.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[120px]"
                placeholder="Describe your responsibilities and achievements..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
