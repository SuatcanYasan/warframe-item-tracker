import { useCallback, useRef, useState } from "react";

const MIN_WIDTH_PERCENT = 15;

export default function useResizablePanels(initialWidths = { search: 20, selected: 45, totals: 35 }) {
  const [widths, setWidths] = useState(initialWidths);
  const containerRef = useRef(null);

  const onResizeStart = useCallback((leftKey, rightKey, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = { ...widths };
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.offsetWidth;

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      const dPercent = (dx / containerWidth) * 100;
      const newLeft = Math.max(MIN_WIDTH_PERCENT, startWidths[leftKey] + dPercent);
      const newRight = Math.max(MIN_WIDTH_PERCENT, startWidths[rightKey] - dPercent);

      // Ensure total doesn't exceed available
      const otherKeys = Object.keys(startWidths).filter((k) => k !== leftKey && k !== rightKey);
      const otherTotal = otherKeys.reduce((sum, k) => sum + startWidths[k], 0);
      const available = 100 - otherTotal;

      if (newLeft + newRight <= available + 0.5) {
        setWidths((prev) => ({
          ...prev,
          [leftKey]: newLeft,
          [rightKey]: newRight,
        }));
      }
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [widths]);

  return { widths, setWidths, containerRef, onResizeStart };
}
