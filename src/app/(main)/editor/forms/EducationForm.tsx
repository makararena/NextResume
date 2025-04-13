import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditorFormProps } from "@/lib/types";
import { useEffect, useState } from "react";

// A simplified version of the education form that doesn't rely on problematic dependencies
export default function EducationForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Keep local state of educations
  const [educations, setEducations] = useState(resumeData.educations || []);
  
  // Update parent state when educations change
  useEffect(() => {
    setResumeData({
      ...resumeData,
      educations: educations,
    });
  }, [educations, resumeData, setResumeData]);

  // Add a new education entry
  const addEducation = () => {
    setEducations([
      ...educations,
      {
        degree: "",
        school: "",
        startDate: "",
        endDate: "",
        description: "",
      }
    ]);
  };

  // Remove an education entry
  const removeEducation = (index: number) => {
    const newEducations = [...educations];
    newEducations.splice(index, 1);
    setEducations(newEducations);
  };

  // Update an education entry
  const updateEducation = (index: number, field: string, value: string) => {
    const newEducations = [...educations];
    newEducations[index] = { 
      ...newEducations[index], 
      [field]: value 
    };
    setEducations(newEducations);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Education</h2>
        <p className="text-sm text-muted-foreground">
          Add your educational background.
        </p>
      </div>

      <div className="space-y-3">
        {educations.map((education, index) => (
          <div 
            key={index}
            className="space-y-3 rounded-md border bg-background p-3"
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">Education {index + 1}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeEducation(index)}
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Degree</label>
                <Input 
                  value={education.degree || ''} 
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  autoFocus={index === 0}
                />
              </div>

              <div>
                <label className="text-sm font-medium">School</label>
                <Input 
                  value={education.school || ''} 
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={education.startDate?.slice(0, 10) || ''}
                    onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={education.endDate?.slice(0, 10) || ''}
                    onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={education.description || ''}
                  onChange={(e) => updateEducation(index, 'description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={addEducation}
          >
            Add Education
          </Button>
        </div>
      </div>
    </div>
  );
}
