import type { CSSProperties, RefObject } from "react";
import type { PaperDimensions, PaperSettings } from "./model";

interface PreviewPanelProps {
  settings: PaperSettings;
  dimensions: PaperDimensions;
  previewRatio: string;
  previewPaperRef: RefObject<HTMLDivElement | null>;
  printablePatternStyle: CSSProperties;
  previewScalePxPerMm: number;
  paddingPx: number;
  dotWidthPx: number;
  dotSpacingPx: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export function PreviewPanel({
  settings,
  dimensions,
  previewRatio,
  previewPaperRef,
  printablePatternStyle,
  previewScalePxPerMm,
  paddingPx,
  dotWidthPx,
  dotSpacingPx,
  printableWidthMm,
  printableHeightMm,
}: PreviewPanelProps) {
  return (
    <section className="preview-panel" aria-label="Paper preview panel">
      <h2>Preview</h2>
      <div className="preview-stage">
        <div
          className="preview-paper"
          ref={previewPaperRef}
          style={{ aspectRatio: previewRatio }}
        >
          <div
            className="preview-printable-area"
            style={printablePatternStyle}
            aria-hidden="true"
          />
          <span className="preview-placeholder">Preview</span>
          <div className="preview-meta">
            <span>
              {settings.paperSize} {settings.orientation} ({dimensions.widthMm}{" "}
              x {dimensions.heightMm} mm)
            </span>
            <span>
              Pattern: {settings.pattern} | Color: {settings.patternColor}
            </span>
            <span>
              Scale: {previewScalePxPerMm.toFixed(3)} px/mm | Padding:{" "}
              {settings.pagePaddingMm.toFixed(1)} mm ({paddingPx.toFixed(1)} px)
            </span>
            <span>
              Dot width: {settings.dotWidthMm.toFixed(1)} mm (
              {dotWidthPx.toFixed(2)} px) | Spacing:{" "}
              {settings.dotSpacingMm.toFixed(1)} mm ({dotSpacingPx.toFixed(2)}{" "}
              px)
            </span>
            <span>
              Printable area: {printableWidthMm.toFixed(1)} x{" "}
              {printableHeightMm.toFixed(1)} mm
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
