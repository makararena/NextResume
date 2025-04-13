import React, { useEffect, useState } from "react";

// Update the type to accept either a standard React.RefObject or an object with a current property
type RefType = React.RefObject<HTMLElement> | { current: HTMLElement | null };

export default function useDimensions(containerRef: RefType) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const currentRef = containerRef.current;

    function getDimensions() {
      return {
        width: currentRef?.offsetWidth || 0,
        height: currentRef?.offsetHeight || 0,
      };
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions(getDimensions());
      }
    });

    if (currentRef) {
      resizeObserver.observe(currentRef);
      setDimensions(getDimensions());
    }

    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return dimensions;
}
