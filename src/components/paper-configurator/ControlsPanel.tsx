import { NumericField } from "./NumericField";
import {
  dotSpacingConstraints,
  dotWidthConstraints,
  isHexColor,
  isOrientation,
  isPaperSize,
  isPattern,
  orientationOptions,
  pagePaddingConstraints,
  patternOptions,
  paperSizeOptions,
  type NumericSettingKey,
  type Orientation,
  type PaperSettings,
  type Pattern,
  type PrintMessageTone,
  type PaperSize,
} from "./model";

interface ControlsPanelData {
  settings: PaperSettings;
  numericInputs: Record<NumericSettingKey, string>;
  numericValidation: Partial<Record<NumericSettingKey, string>>;
  pagePaddingMax: number;
}

interface ControlsPanelPrintState {
  isPrinting: boolean;
  printMessage: string;
  printMessageTone: PrintMessageTone;
}

interface ControlsPanelActions {
  onPaperSizeChange: (value: PaperSize) => void;
  onOrientationChange: (value: Orientation) => void;
  onPatternColorChange: (value: string) => void;
  onPatternChange: (value: Pattern) => void;
  onNumericInputChange: (key: NumericSettingKey, value: string) => void;
  onNumericInputCommitted: (key: NumericSettingKey) => void;
  onResetToDefaults: () => void;
  onPrintClick: () => void;
}

interface ControlsPanelProps {
  data: ControlsPanelData;
  printState: ControlsPanelPrintState;
  actions: ControlsPanelActions;
}

const orientationLabels: Record<Orientation, string> = {
  portrait: "Portrait",
  landscape: "Landscape",
};

const patternLabels: Record<Pattern, string> = {
  dots: "Dots",
};

interface BasicsSectionProps {
  settings: PaperSettings;
  actions: Pick<
    ControlsPanelActions,
    | "onPaperSizeChange"
    | "onOrientationChange"
    | "onPatternColorChange"
    | "onPatternChange"
  >;
}

function BasicsSection({ settings, actions }: BasicsSectionProps) {
  return (
    <>
      <label>
        Paper size
        <select
          value={settings.paperSize}
          onChange={(event) => {
            const selectedPaperSize = event.target.value;
            if (!isPaperSize(selectedPaperSize)) {
              return;
            }

            actions.onPaperSizeChange(selectedPaperSize);
          }}
        >
          {paperSizeOptions.map((paperSizeOption) => (
            <option key={paperSizeOption} value={paperSizeOption}>
              {paperSizeOption}
            </option>
          ))}
        </select>
      </label>

      <label>
        Orientation
        <select
          value={settings.orientation}
          onChange={(event) => {
            const selectedOrientation = event.target.value;
            if (!isOrientation(selectedOrientation)) {
              return;
            }

            actions.onOrientationChange(selectedOrientation);
          }}
        >
          {orientationOptions.map((orientationOption) => (
            <option key={orientationOption} value={orientationOption}>
              {orientationLabels[orientationOption]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Pattern color
        <input
          type="color"
          value={settings.patternColor}
          onChange={(event) => {
            const selectedColor = event.target.value;
            if (!isHexColor(selectedColor)) {
              return;
            }

            actions.onPatternColorChange(selectedColor);
          }}
        />
      </label>

      <label>
        Pattern
        <select
          value={settings.pattern}
          onChange={(event) => {
            const selectedPattern = event.target.value;
            if (!isPattern(selectedPattern)) {
              return;
            }

            actions.onPatternChange(selectedPattern);
          }}
        >
          {patternOptions.map((patternOption) => (
            <option key={patternOption} value={patternOption}>
              {patternLabels[patternOption]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

interface NumericSectionProps {
  data: Pick<
    ControlsPanelData,
    "numericInputs" | "numericValidation" | "pagePaddingMax"
  >;
  actions: Pick<
    ControlsPanelActions,
    "onNumericInputChange" | "onNumericInputCommitted"
  >;
}

interface NumericFieldConfig {
  key: NumericSettingKey;
  label: string;
  step: number;
  min: number;
  max: number;
  errorId: string;
}

function NumericSection({ data, actions }: NumericSectionProps) {
  const fieldConfigs: NumericFieldConfig[] = [
    {
      key: "dotWidthMm",
      label: "Dot width (mm)",
      step: dotWidthConstraints.step,
      min: dotWidthConstraints.min,
      max: dotWidthConstraints.max,
      errorId: "dotWidthMm-error",
    },
    {
      key: "dotSpacingMm",
      label: "Dot spacing (mm)",
      step: dotSpacingConstraints.step,
      min: dotSpacingConstraints.min,
      max: dotSpacingConstraints.max,
      errorId: "dotSpacingMm-error",
    },
    {
      key: "pagePaddingMm",
      label: "Page padding (mm)",
      step: pagePaddingConstraints.step,
      min: pagePaddingConstraints.min,
      max: data.pagePaddingMax,
      errorId: "pagePaddingMm-error",
    },
  ];

  return (
    <>
      {fieldConfigs.map((fieldConfig) => (
        <NumericField
          key={fieldConfig.key}
          label={fieldConfig.label}
          step={fieldConfig.step}
          min={fieldConfig.min}
          max={fieldConfig.max}
          value={data.numericInputs[fieldConfig.key]}
          error={data.numericValidation[fieldConfig.key]}
          errorId={fieldConfig.errorId}
          onChange={(value) => {
            actions.onNumericInputChange(fieldConfig.key, value);
          }}
          onBlur={() => {
            actions.onNumericInputCommitted(fieldConfig.key);
          }}
        />
      ))}
    </>
  );
}

interface ActionsSectionProps {
  isPrinting: boolean;
  onResetToDefaults: () => void;
  onPrintClick: () => void;
}

function ActionsSection({
  isPrinting,
  onResetToDefaults,
  onPrintClick,
}: ActionsSectionProps) {
  return (
    <div className="controls-actions">
      <button
        type="button"
        className="button-secondary"
        onClick={onResetToDefaults}
      >
        Reset
      </button>
      <button type="button" onClick={onPrintClick} disabled={isPrinting}>
        {isPrinting ? "Preparing..." : "Print"}
      </button>
    </div>
  );
}

interface PrintMessageProps {
  message: string;
  tone: PrintMessageTone;
}

function PrintMessage({ message, tone }: PrintMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="print-message" data-tone={tone} role="status">
      {message}
    </p>
  );
}

export function ControlsPanel({
  data,
  printState,
  actions,
}: ControlsPanelProps) {
  return (
    <section className="controls-panel" aria-label="Configuration form panel">
      <h2>Configuration</h2>
      <form className="controls-form">
        <BasicsSection settings={data.settings} actions={actions} />
        <NumericSection
          data={{
            numericInputs: data.numericInputs,
            numericValidation: data.numericValidation,
            pagePaddingMax: data.pagePaddingMax,
          }}
          actions={actions}
        />
        <ActionsSection
          isPrinting={printState.isPrinting}
          onResetToDefaults={actions.onResetToDefaults}
          onPrintClick={actions.onPrintClick}
        />
      </form>

      <PrintMessage
        message={printState.printMessage}
        tone={printState.printMessageTone}
      />
    </section>
  );
}
