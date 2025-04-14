import { useEffect, useState, useRef } from "react";

export default function useDebounce<T>(value: T, delay: number = 250) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef<T>(value);
  
  // Function to check if values are deeply equal (simplified for common cases)
  const areValuesEqual = (a: T, b: T): boolean => {
    // For primitives
    if (a === b) return true;
    
    // For null or undefined
    if (a == null && b == null) return true;
    
    // For arrays, compare length and values
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    // For objects, compare serialized versions
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  };

  useEffect(() => {
    // Skip the debounce if value hasn't changed
    if (areValuesEqual(previousValueRef.current, value)) {
      console.log("🔄 useDebounce: Value unchanged, skipping debounce");
      return;
    }
    
    console.log("⏱️ useDebounce: Setting up new debounce timer");
    previousValueRef.current = value;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set up new timer
    timerRef.current = setTimeout(() => {
      console.log("⏱️ useDebounce: Timer finished, updating debounced value");
      setDebouncedValue(value);
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
