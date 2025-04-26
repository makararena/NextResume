import { useEffect, useState, useRef } from "react";
import isEqual from "lodash/isEqual";

export default function useDebounce<T>(value: T, delay: number = 250) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef<T>(value);
  
  useEffect(() => {
    // Use lodash's isEqual for more reliable deep comparison
    if (isEqual(previousValueRef.current, value)) {
      console.log("🔄 useDebounce: Value unchanged, skipping debounce");
      return;
    }
    
    console.log("⏱️ useDebounce: Setting up new debounce timer");
    previousValueRef.current = structuredClone(value); // Use structuredClone for deep copy
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set up new timer
    timerRef.current = setTimeout(() => {
      console.log("⏱️ useDebounce: Timer finished, updating debounced value");
      setDebouncedValue(structuredClone(value)); // Use structuredClone for deep copy
      timerRef.current = null;
    }, delay);

    // Cleanup on unmount or when value/delay changes
    return () => {
      if (timerRef.current) {
        console.log("🧹 useDebounce: Cleaning up timer");
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
