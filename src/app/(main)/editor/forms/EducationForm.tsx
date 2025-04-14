import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditorFormProps } from "@/lib/types";
import { useEffect, useState, useRef, useMemo } from "react";
import isEqual from "lodash/isEqual";

// A simplified version of the education form that doesn't rely on problematic dependencies
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
  
  // Keep local state of educations
  const [educations, setEducations] = useState(resumeData.educations || []);
  
  // Reference to previous educations to prevent unnecessary updates
  const prevEducationsRef = useRef(educations);
  
  // Memoize initial education data
  useMemo(() => {
    if (resumeData.educations?.length && !educations.length) {
      console.log("🔄 Initializing educations from resumeData");
      setEducations(resumeData.educations);
    }
  }, [resumeData.educations, educations.length]);
  
  // Update parent state when educations change, with equality check
  useEffect(() => {
    console.log("🎯 useEffect triggered in EducationForm for educations change");
    
    // Don't update on first render or if no changes
    if (isEqual(prevEducationsRef.current, educations)) {
      console.log("⏭️ Skipping update - educations unchanged");
      return;
    }
    
    console.log("✅ Educations changed, updating parent state");
    prevEducationsRef.current = educations;
    
    setResumeData((prevResumeData) => {
      const newData = {
        ...prevResumeData,
        educations: educations,
      };
      
      // Double check if there's an actual change
      if (isEqual(prevResumeData.educations, newData.educations)) {
        console.log("🚫 No actual change in educations detected");
        return prevResumeData;
      }
      
      console.log("✅ Updating resumeData with new educations");
      return newData;
    });
  }, [educations, setResumeData]);

  // Add a new education entry
  const addEducation = () => {
    console.log("➕ Adding new education entry");
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
    console.log(`❌ Removing education at index ${index}`);
    const newEducations = [...educations];
    newEducations.splice(index, 1);
    setEducations(newEducations);
  };

  // Update an education entry
  const updateEducation = (index: number, field: string, value: string) => {
    console.log(`✏️ Updating education at index ${index}, field: ${field}`);
    const newEducations = [...educations];
    newEducations[index] = { 
      ...newEducations[index], 
      [field]: value 
    };
    setEducations(newEducations);
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
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Education</h2>
        <p className="text-sm text-muted-foreground">
          Add your educational background.
        </p>
      </div>
      
      {educations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No education entries added yet.</p>
          <Button onClick={addEducation}>Add Education</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {educations.map((education, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Education #{index + 1}</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  Remove
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium">Degree / Certificate</label>
                    <Input 
                      value={education.degree || ''}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor of Science in Computer Science" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">School / University</label>
                    <Input 
                      value={education.school || ''}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      placeholder="e.g. Stanford University" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date"
                      value={getDateValue(education.startDate)}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date"
                      value={getDateValue(education.endDate)}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2">
                  Leave end date empty if this is your current education.
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={education.description || ''}
                    onChange={(e) => updateEducation(index, 'description', e.target.value)}
                    placeholder="Describe your studies, achievements, etc."
                    rows={3} 
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addEducation} className="w-full">
            Add Another Education
          </Button>
        </div>
      )}
    </div>
  );
}
