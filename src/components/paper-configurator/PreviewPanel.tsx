import type { CSSProperties, ReactNode, RefObject } from "react";
import type { PaperDimensions, PaperSettings } from "./model";
import type { PreviewMetricsModel } from "./preview-model";

interface PreviewSurfaceProps {
  previewRatio: string;
  previewPaperRef: RefObject<HTMLDivElement | null>;
  printablePatternStyle: CSSProperties;
}

interface PreviewPanelProps {
  settings: PaperSettings;
  dimensions: PaperDimensions;
  surface: PreviewSurfaceProps;
  metrics: PreviewMetricsModel;
}

interface PreviewPaperProps {
  surface: PreviewSurfaceProps;
  children: ReactNode;
}

function PreviewPaper({ surface, children }: PreviewPaperProps) {
  return (
    <div
      className="preview-paper"
      ref={surface.previewPaperRef}
      style={{ aspectRatio: surface.previewRatio }}
    >
      <div
        className="preview-printable-area"
        style={surface.printablePatternStyle}
        aria-hidden="true"
      />
      <span className="preview-placeholder">Preview</span>
      {children}
    </div>
  );
}

interface PreviewMetaProps {
  settings: PaperSettings;
  dimensions: PaperDimensions;
  metrics: PreviewMetricsModel;
}

function PreviewMeta({ settings, dimensions, metrics }: PreviewMetaProps) {
  return (
    <div className="preview-meta">
      <span>
        {settings.paperSize} {settings.orientation} ({dimensions.widthMm} x{" "}
        {dimensions.heightMm} mm)
      </span>
      <span>
        Pattern: {settings.pattern} | Color: {settings.patternColor}
      </span>
      <span>
        Scale: {metrics.previewScalePxPerMm.toFixed(3)} px/mm | Padding:{" "}
        {settings.pagePaddingMm.toFixed(1)} mm ( {metrics.paddingPx.toFixed(1)}{" "}
        px)
      </span>
      <span>
        Dot width: {settings.dotWidthMm.toFixed(1)} mm (
        {metrics.dotWidthPx.toFixed(2)} px) | Spacing:{" "}
        {settings.dotSpacingMm.toFixed(1)} mm ({metrics.dotSpacingPx.toFixed(2)}{" "}
        px)
      </span>
      <span>
        Printable area: {metrics.printableWidthMm.toFixed(1)} x{" "}
        {metrics.printableHeightMm.toFixed(1)} mm
      </span>
    </div>
  );
}

export function PreviewPanel({
  settings,
  dimensions,
  surface,
  metrics,
}: PreviewPanelProps) {
  return (
    <section className="preview-panel" aria-label="Paper preview panel">
      <h2>Preview</h2>
      <div className="preview-stage">
        <PreviewPaper surface={surface}>
          <PreviewMeta
            settings={settings}
            dimensions={dimensions}
            metrics={metrics}
          />
        </PreviewPaper>
      </div>
    </section>
  );
}
