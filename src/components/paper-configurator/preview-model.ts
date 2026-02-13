import type { CSSProperties } from "react";
import type { PaperDimensions, PaperSettings, PreviewSize } from "./model";

export interface PreviewSurfaceModel {
  previewRatio: string;
  printablePatternStyle: CSSProperties;
}

export interface PreviewMetricsModel {
  previewScalePxPerMm: number;
  paddingPx: number;
  dotWidthPx: number;
  dotSpacingPx: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export interface PreviewModel {
  surface: PreviewSurfaceModel;
  metrics: PreviewMetricsModel;
}

export const buildPreviewModel = (
  settings: PaperSettings,
  dimensions: PaperDimensions,
  previewSize: PreviewSize,
): PreviewModel => {
  const previewScalePxPerMm =
    previewSize.widthPx > 0 && previewSize.heightPx > 0
      ? Math.min(
          previewSize.widthPx / dimensions.widthMm,
          previewSize.heightPx / dimensions.heightMm,
        )
      : 0;

  const paddingPx = settings.pagePaddingMm * previewScalePxPerMm;
  const dotWidthPx = settings.dotWidthMm * previewScalePxPerMm;
  const dotSpacingPx = settings.dotSpacingMm * previewScalePxPerMm;
  const printableWidthMm = Math.max(
    0,
    dimensions.widthMm - settings.pagePaddingMm * 2,
  );
  const printableHeightMm = Math.max(
    0,
    dimensions.heightMm - settings.pagePaddingMm * 2,
  );
  const dotRadiusPx = Math.max(dotWidthPx / 2, 0);
  const hasPreviewPattern =
    previewScalePxPerMm > 0 && dotSpacingPx > 0 && dotRadiusPx > 0;

  const printablePatternStyle: CSSProperties = hasPreviewPattern
    ? {
        inset: `${paddingPx}px`,
        backgroundImage: `radial-gradient(circle, ${settings.patternColor} 0 ${dotRadiusPx.toFixed(3)}px, transparent ${dotRadiusPx.toFixed(3)}px)`,
        backgroundSize: `${dotSpacingPx.toFixed(3)}px ${dotSpacingPx.toFixed(3)}px`,
      }
    : {
        inset: `${paddingPx}px`,
      };

  return {
    surface: {
      previewRatio: `${dimensions.widthMm} / ${dimensions.heightMm}`,
      printablePatternStyle,
    },
    metrics: {
      previewScalePxPerMm,
      paddingPx,
      dotWidthPx,
      dotSpacingPx,
      printableWidthMm,
      printableHeightMm,
    },
  };
};
