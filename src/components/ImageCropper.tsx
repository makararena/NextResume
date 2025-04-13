"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  open: boolean;
  onClose: () => void;
  aspectRatio?: number;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  imageUrl,
  onCropComplete,
  open,
  onClose,
  aspectRatio = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const handleCropComplete = useCallback(
    (croppedArea: CroppedArea, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    try {
      if (!croppedAreaPixels) return;
      
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error("Error creating cropped image:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crop your photo</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[300px] mt-4">
          <div className="absolute inset-0 z-0 overflow-hidden rounded-full pointer-events-none border-2 border-green-500 opacity-25 m-auto top-0 bottom-0 left-0 right-0" style={{ width: '200px', height: '200px' }}></div>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={handleCropComplete}
            onZoomChange={onZoomChange}
            cropShape="round"
            showGrid={false}
            objectFit="contain"
            cropSize={{ width: 200, height: 200 }}
          />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Zoom</p>
            <span className="text-xs bg-muted px-2 py-1 rounded-md">{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
            className="mt-1"
          />
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Drag to position • Pinch or slide to zoom
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={createCroppedImage}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create a cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set a fixed size for the output image (profile photos don't need to be large)
  const outputSize = 200; // 200x200 is plenty for a profile photo
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  // Fill with white background first
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, outputSize, outputSize);
  
  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI, true);
  ctx.closePath();
  ctx.clip();

  // Calculate center of the cropped area
  const centerX = pixelCrop.x + pixelCrop.width / 2;
  const centerY = pixelCrop.y + pixelCrop.height / 2;
  
  // Calculate source dimensions (use the diameter from the original crop)
  const diameter = Math.min(pixelCrop.width, pixelCrop.height);
  const sourceX = centerX - diameter / 2;
  const sourceY = centerY - diameter / 2;

  // Draw the cropped image onto the canvas, resizing it to our fixed size
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    diameter,
    diameter,
    0,
    0,
    outputSize,
    outputSize
  );

  // Convert canvas to blob with JPEG compression
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.85); // Use JPEG with 85% quality for smaller file size
  });
} 