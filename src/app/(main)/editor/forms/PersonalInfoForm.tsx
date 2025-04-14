import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EditorFormProps } from "@/lib/types";
import { personalInfoSchema, PersonalInfoValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import ImageCropper from "@/components/ImageCropper";
import Image from "next/image";
import { Crop, User } from "lucide-react";
import { toast } from "sonner";
import isEqual from "lodash/isEqual";

export default function PersonalInfoForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  // Add render count for debugging
  const renderCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);
  
  console.log("🚀 Rendering PersonalInfoForm");
  console.log(`🧮 PersonalInfoForm render count: ${renderCount()}`);
  console.log("🚀 resumeData in PersonalInfoForm:", resumeData);
  
  // Store previous form values to prevent unnecessary updates
  const prevFormValuesRef = useRef<PersonalInfoValues | null>(null);

  // Handle photo correctly for the form
  const photoValue = useMemo(() => {
    // If it's a File object, use it directly
    if (resumeData.photo instanceof File) {
      return resumeData.photo;
    }
    // Otherwise, return undefined to avoid type issues
    return undefined;
  }, [resumeData.photo]);

  const defaultValues = useMemo(() => {
    console.log("🧩 Calculating defaultValues for PersonalInfoForm");
    return {
      firstName: resumeData.firstName || "",
      lastName: resumeData.lastName || "",
      jobTitle: resumeData.jobTitle || "",
      city: resumeData.city || "",
      country: resumeData.country || "",
      phone: resumeData.phone || "",
      email: resumeData.email || "",
      // Only use photo if it's a File object, otherwise undefined
      photo: photoValue,
    };
  }, [
    resumeData.firstName,
    resumeData.lastName,
    resumeData.jobTitle,
    resumeData.city,
    resumeData.country,
    resumeData.phone,
    resumeData.email,
    photoValue
  ]);

  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues,
  });
  
  // Reset form when defaultValues change
  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    console.log("🎯 useEffect watch triggered in PersonalInfoForm");
    
    const subscription = form.watch((values) => {
      console.log("👀 Form values changed in PersonalInfoForm:", values);
      
      // Don't proceed if values are same as the last ones we processed
      if (prevFormValuesRef.current && isEqual(prevFormValuesRef.current, values)) {
        console.log("⏭️ Skipping update - values identical to last processed values");
        return;
      }

      // Store current values to prevent future duplicate processing
      prevFormValuesRef.current = { ...values };

      // Validate form
      form.trigger().then((isValid) => {
        console.log("✅ Form validation result:", isValid);
        if (!isValid) {
          console.log("⏭️ Skipping update - form invalid");
          return;
        }

        // Use type-safe function for updating resumeData
        setResumeData((prevData) => {
          // Create new data with form values
          const newData = { ...prevData, ...values };

          console.log("🧩 setResumeData called in PersonalInfoForm");
          
          // Deep equality check to ensure we only update if there's an actual change
          if (!isEqual(
            { 
              firstName: prevData.firstName, 
              lastName: prevData.lastName,
              jobTitle: prevData.jobTitle,
              city: prevData.city,
              country: prevData.country,
              phone: prevData.phone,
              email: prevData.email,
              photo: prevData.photo
            }, 
            { 
              firstName: newData.firstName, 
              lastName: newData.lastName,
              jobTitle: newData.jobTitle,
              city: newData.city,
              country: newData.country,
              phone: newData.phone,
              email: newData.email,
              photo: newData.photo
            }
          )) {
            console.log("✅ Data changed in PersonalInfoForm, updating state");
            return newData;
          } else {
            console.log("🚫 No data change detected in PersonalInfoForm");
            return prevData;
          }
        });
      });
    });

    return () => {
      console.log("🧹 Cleaning up subscription in PersonalInfoForm");
      subscription.unsubscribe();
    };
  }, [form, setResumeData]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // For cleaning up blob URLs
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      if (originalPhotoUrl && originalPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(originalPhotoUrl);
      }
    };
  }, [photoPreview, originalPhotoUrl]);

  // Initialize photo preview if photo exists in resumeData
  useEffect(() => {
    // If photo is a File, use it directly
    if (resumeData.photo instanceof File) {
      console.log("Photo is a File object, creating preview URL");
      const objectUrl = URL.createObjectURL(resumeData.photo);
      setPhotoPreview(objectUrl);
      setOriginalPhotoUrl(objectUrl);
      
      // Clean up function
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } 
    // If photo is a string URL
    else if (typeof resumeData.photo === 'string' && resumeData.photo) {
      console.log("Photo is a string URL, using directly for preview", resumeData.photo);
      setPhotoPreview(resumeData.photo);
      setOriginalPhotoUrl(resumeData.photo);
    } 
    // If photoUrl exists (for AI-generated resumes)
    else if (resumeData.photoUrl) {
      console.log("Using photoUrl for preview", resumeData.photoUrl);
      setPhotoPreview(resumeData.photoUrl);
      // Don't set originalPhotoUrl to prevent unnecessary cropping
      // Users will need to crop the photo first to create a File object
    } 
    // No photo found
    else {
      console.log("No photo found in resumeData");
      setPhotoPreview(null);
      setOriginalPhotoUrl(null);
    }
  }, [resumeData.photo, resumeData.photoUrl]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo is too large. Maximum size is 5MB");
        return;
      }
      
      // If the file is still quite large (over 2MB), warn the user
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Large image detected. The photo will be compressed for better performance.");
      }
      
      // Create a temporary URL instead of loading the full image into memory
      const objectUrl = URL.createObjectURL(file);
      setOriginalPhotoUrl(objectUrl);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Create a file from the blob
    const fileName = "profile-photo.jpg";
    const croppedFile = new File([croppedImageBlob], fileName, {
      type: "image/jpeg" // Always use JPEG format for consistency
    });
    
    // Update form with the File object (this matches the expected type)
    form.setValue("photo", croppedFile, { shouldValidate: true });
    
    // Clean up any object URL we created for the original photo
    if (originalPhotoUrl && originalPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalPhotoUrl);
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedFile);
    setPhotoPreview(previewUrl);
    
    // Also update the resumeData directly to ensure we have the latest photo
    // This handles type issues by passing the actual File object
    setResumeData((prevData) => {
      return {
        ...prevData,
        photo: croppedFile
      };
    });
  };

  // Function to handle direct cropping of existing image URLs
  const handleExistingImageCrop = () => {
    if (photoPreview) {
      setOriginalPhotoUrl(photoPreview);
      setShowCropper(true);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Personal info</h2>
        <p className="text-sm text-muted-foreground">Tell us about yourself.</p>
      </div>
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="photo"
            render={({ field: { value, onChange, ...fieldValues } }) => (
              <FormItem className="text-center">
                <FormLabel>Your photo</FormLabel>
                <div className="flex flex-col items-center">
                  <FormControl>
                    <div className="flex flex-col items-center">
                      {photoPreview ? (
                        <div className="relative w-36 h-36 overflow-hidden rounded-full mb-4 border-2 border-green-500">
                          <Image 
                            src={photoPreview}
                            alt="Your photo"
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleExistingImageCrop();
                              }}
                              className="bg-primary text-primary-foreground p-2 rounded-full mr-2"
                            >
                              <Crop className="size-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                onChange(null);
                                setPhotoPreview(null);
                                setOriginalPhotoUrl(null);
                                if (photoInputRef.current) {
                                  photoInputRef.current.value = "";
                                }
                              }}
                              className="bg-destructive text-destructive-foreground p-2 rounded-full"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 rounded-full bg-muted/50 p-4 w-36 h-36 flex items-center justify-center">
                          <User className="size-16 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          {...fieldValues}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoChange(e, onChange)}
                          ref={photoInputRef}
                          id="photo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => photoInputRef.current?.click()}
                          className="text-sm"
                        >
                          {value ? "Change Photo" : "Upload Photo"}
                        </Button>
                        {value && (
                          <Button
                            variant="outline"
                            className="text-sm"
                            type="button"
                            onClick={() => {
                              onChange(null);
                              setPhotoPreview(null);
                              setOriginalPhotoUrl(null);
                              if (photoInputRef.current) {
                                photoInputRef.current.value = "";
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG or WEBP up to 5MB
                      </div>
                    </div>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
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
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Image Cropper Modal */}
      {originalPhotoUrl && (
        <ImageCropper
          imageUrl={originalPhotoUrl}
          onCropComplete={handleCropComplete}
          open={showCropper}
          onClose={() => setShowCropper(false)}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
