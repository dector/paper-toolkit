import { useMemo, useReducer, useRef } from "react";
import "./PaperConfigurator.css";
import { ControlsPanel } from "./paper-configurator/ControlsPanel";
import { PreviewPanel } from "./paper-configurator/PreviewPanel";
import { buildPreviewModel } from "./paper-configurator/preview-model";
import { usePreviewSize } from "./paper-configurator/usePreviewSize";
import { usePrintWorkflow } from "./paper-configurator/usePrintWorkflow";
import {
  configuratorReducer,
  initialState,
  maxPaddingMm,
  resolveDimensions,
  type NumericSettingKey,
  type Orientation,
  type PaperSize,
  type Pattern,
} from "./paper-configurator/model";

export default function PaperConfigurator() {
  const [state, dispatch] = useReducer(configuratorReducer, initialState);
  const previewPaperRef = useRef<HTMLDivElement | null>(null);
  const { settings, numericInputs, numericValidation, printMessage } = state;

  const previewSize = usePreviewSize(previewPaperRef);
  const dimensions = useMemo(
    () => resolveDimensions(settings),
    [settings.paperSize, settings.orientation],
  );
  const pagePaddingMax = maxPaddingMm(dimensions);
  const previewModel = useMemo(
    () => buildPreviewModel(settings, dimensions, previewSize),
    [settings, dimensions, previewSize],
  );

  const { isPrinting, printMessageTone, handlePrintClick } = usePrintWorkflow({
    settings,
    setPrintMessage: (value) => {
      dispatch({ type: "printMessageSet", value });
    },
  });

  const previewSurface = {
    previewPaperRef,
    ...previewModel.surface,
  };

  const controlsData = {
    settings,
    numericInputs,
    numericValidation,
    pagePaddingMax,
  };

  const controlsActions = {
    onPaperSizeChange: (value: PaperSize) => {
      dispatch({ type: "paperSizeChanged", value });
    },
    onOrientationChange: (value: Orientation) => {
      dispatch({ type: "orientationChanged", value });
    },
    onPatternColorChange: (value: string) => {
      dispatch({ type: "patternColorChanged", value });
    },
    onPatternChange: (value: Pattern) => {
      dispatch({ type: "patternChanged", value });
    },
    onNumericInputChange: (key: NumericSettingKey, value: string) => {
      dispatch({ type: "numericInputChanged", key, value });
    },
    onNumericInputCommitted: (key: NumericSettingKey) => {
      dispatch({ type: "numericInputCommitted", key });
    },
    onResetToDefaults: () => {
      dispatch({ type: "resetDefaults" });
    },
    onPrintClick: handlePrintClick,
  };

  return (
    <main className="configurator-page">
      <h1 className="configurator-title">Paper Pattern Configurator</h1>
      <p className="configurator-subtitle">
        Adjust settings on the right and review the page surface on the left.
      </p>
      <div className="configurator-layout">
        <PreviewPanel
          settings={settings}
          dimensions={dimensions}
          surface={previewSurface}
          metrics={previewModel.metrics}
        />

        <ControlsPanel
          data={controlsData}
          printState={{ isPrinting, printMessage, printMessageTone }}
          actions={controlsActions}
        />
      </div>
    </main>
  );
}
