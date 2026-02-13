import { useEffect, useState, type RefObject } from "react";
import type { PreviewSize } from "./model";

const initialPreviewSize: PreviewSize = {
  widthPx: 0,
  heightPx: 0,
};

export const usePreviewSize = (
  previewPaperRef: RefObject<HTMLDivElement | null>,
) => {
  const [previewSize, setPreviewSize] =
    useState<PreviewSize>(initialPreviewSize);

  useEffect(() => {
    const paperElement = previewPaperRef.current;
    if (!paperElement) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setPreviewSize({
        widthPx: entry.contentRect.width,
        heightPx: entry.contentRect.height,
      });
    });

    resizeObserver.observe(paperElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [previewPaperRef]);

  return previewSize;
};
