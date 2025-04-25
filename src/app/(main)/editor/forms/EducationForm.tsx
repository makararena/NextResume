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
import { educationSchema, EducationValues } from "@/lib/validation";
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

export default function EducationForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count for debugging
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering EducationForm");
  console.log(`🧮 EducationForm render count: ${renderCount()}`);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<EducationValues | null>(null);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues for EducationForm");
    
    // Make sure all educations fields are properly initialized
    const sanitizedEducations = (resumeData.educations || []).map(edu => ({
      degree: edu.degree || "",
      school: edu.school || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      description: edu.description || ""
    }));
    
    return {
      educations: sanitizedEducations,
    };
  }, [resumeData.educations]);

  const form = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues,
  });
  
  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in EducationForm");
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in EducationForm:", values);
      
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
        
        // Process educations to filter out undefined values
        const processedEducations = values.educations?.filter((edu) => edu !== undefined) || [];
        
        // Store current values to prevent future duplicate processing
        prevFormValuesRef.current = { 
          educations: processedEducations 
        };
        
        setResumeData((prevData) => {
          const newData = { 
            ...prevData, 
            educations: processedEducations
          };
          
          console.log("🧩 setResumeData called in EducationForm");
          
          // Deep equality check to ensure we only update if there's an actual change
          if (!isEqual(prevData.educations, newData.educations)) {
            console.log("✅ Data changed in EducationForm, updating state");
            return newData;
          } else {
            console.log("🚫 No data change detected in EducationForm");
            return prevData;
          }
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in EducationForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "educations",
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Education</h2>
        <p className="text-sm text-muted-foreground">
          Add your educational background.
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
                <EducationItem
                  id={field.fieldId}
                  key={field.fieldId}
                  index={index}
                  form={form}
                  remove={remove}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => {
                console.log("➕ Adding new education");
                try {
                  append({
                    degree: "",
                    school: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  });
                  // Force form to recognize the new field
                  setTimeout(() => {
                    form.trigger();
                  }, 0);
                } catch (error) {
                  console.error("Error adding education:", error);
                }
              }}
            >
              Add education
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface EducationItemProps {
  id: string;
  form: UseFormReturn<EducationValues>;
  index: number;
  remove: (index: number) => void;
}

function EducationItem({
  id,
  form,
  index,
  remove,
}: EducationItemProps) {
  console.log(`🧩 Rendering EducationItem ${index + 1}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Safe handler for removing education
  const handleRemove = () => {
    console.log(`❌ Removing education at index ${index}`);
    try {
      // Use a timeout to avoid React state update conflicts
      setTimeout(() => {
        remove(index);
      }, 0);
    } catch (error) {
      console.error("Error removing education:", error);
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
        <span className="font-semibold">Education {index + 1}</span>
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
        name={`educations.${index}.degree`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Degree / Certificate</FormLabel>
            <FormControl>
              <Input {...field} autoFocus={index === 0} placeholder="e.g. Bachelor of Science in Computer Science" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`educations.${index}.school`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>School / University</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Stanford University" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name={`educations.${index}.startDate`}
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
          name={`educations.${index}.endDate`}
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
        Leave <span className="font-semibold">end date</span> empty if this is your current education.
      </FormDescription>
      <FormField
        control={form.control}
        name={`educations.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[120px]"
                placeholder="Describe your studies, achievements, etc."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
