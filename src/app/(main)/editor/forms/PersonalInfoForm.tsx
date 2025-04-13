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
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ImageCropper from "@/components/ImageCropper";
import Image from "next/image";
import { Crop, User } from "lucide-react";
import { toast } from "sonner";

export default function PersonalInfoForm({
  resumeData,
  setResumeData,
}: EditorFormProps) {
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: resumeData.firstName || "",
      lastName: resumeData.lastName || "",
      jobTitle: resumeData.jobTitle || "",
      city: resumeData.city || "",
      country: resumeData.country || "",
      phone: resumeData.phone || "",
      email: resumeData.email || "",
      photo: resumeData.photo || undefined,
    },
  });

  useEffect(() => {
    const { unsubscribe } = form.watch(async (values) => {
      const isValid = await form.trigger();
      if (!isValid) return;
      setResumeData({ ...resumeData, ...values });
    });
    return unsubscribe;
  }, [form, resumeData, setResumeData]);

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
    if (resumeData.photo instanceof File) {
      const objectUrl = URL.createObjectURL(resumeData.photo);
      setPhotoPreview(objectUrl);
      setOriginalPhotoUrl(objectUrl);
      
      // Clean up function
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else if (typeof resumeData.photo === 'string' && resumeData.photo) {
      setPhotoPreview(resumeData.photo);
      setOriginalPhotoUrl(resumeData.photo);
    } else if (resumeData.photoUrl) {
      // Handle photoUrl from AI-generated resume
      setPhotoPreview(resumeData.photoUrl);
      // Don't set originalPhotoUrl to prevent unnecessary cropping
      // But update the form value to use this URL
      form.setValue("photo", resumeData.photoUrl, { shouldValidate: true });
    }
  }, [resumeData.photo, resumeData.photoUrl, form]);

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
    
    // Update form
    form.setValue("photo", croppedFile, { shouldValidate: true });
    
    // Clean up any object URL we created for the original photo
    if (originalPhotoUrl && originalPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalPhotoUrl);
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedFile);
    setPhotoPreview(previewUrl);
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
