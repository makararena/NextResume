import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PaletteIcon } from "lucide-react";
import { useState } from "react";
import { Color, ColorChangeHandler, SliderPicker, TwitterPicker } from "react-color";
import { useSubscriptionLevel } from "../SubscriptionLevelProvider";

interface ColorPickerProps {
  color: Color | undefined;
  onChange: ColorChangeHandler;
}

// Extended color palette with more professional choices
const extendedColors = [
  "#000000", // Black
  "#FFFFFF", // White
  "#1A73E8", // Google Blue
  "#2E7D32", // Material Green
  "#C62828", // Material Red
  "#0277BD", // Material Light Blue
  "#4527A0", // Deep Purple
  "#00796B", // Teal
  "#F57C00", // Orange
  "#6A1B9A", // Purple
  "#283593", // Indigo
  "#00695C", // Dark Teal
  "#5D4037", // Brown
  "#546E7A", // Blue Grey
  "#D32F2F", // Red
  "#7B1FA2", // Purple
];

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const subscriptionLevel = useSubscriptionLevel();
  const [showPopover, setShowPopover] = useState(false);
  const [currentTab, setCurrentTab] = useState<'palette' | 'slider'>('palette');

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Change resume color"
        >
          <PaletteIcon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        align="end"
      >
        <div className="space-y-4">
          <div className="flex justify-between text-sm items-center mb-2">
            <p className="font-medium">Choose a color</p>
            <div className="flex">
              <button 
                className={`px-2 py-1 text-xs rounded-l-md ${currentTab === 'palette' ? 'bg-secondary' : 'bg-muted hover:bg-secondary'}`}
                onClick={() => setCurrentTab('palette')}
              >
                Palette
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded-r-md ${currentTab === 'slider' ? 'bg-secondary' : 'bg-muted hover:bg-secondary'}`}
                onClick={() => setCurrentTab('slider')}
              >
                Custom
              </button>
            </div>
          </div>

          {currentTab === 'palette' ? (
            <TwitterPicker 
              color={color} 
              onChange={onChange} 
              triangle="hide" 
              colors={extendedColors}
              width="100%"
            />
          ) : (
            <div className="space-y-3">
              <SliderPicker color={color} onChange={onChange} />
              <div className="flex items-center mt-2">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: typeof color === 'string' ? color : color?.hex }} />
                <span className="text-xs font-mono">{typeof color === 'string' ? color : color?.hex}</span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
