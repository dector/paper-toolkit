import { NumericField } from "./NumericField";
import {
  dotSpacingConstraints,
  dotWidthConstraints,
  isHexColor,
  isOrientation,
  isPaperSize,
  isPattern,
  pagePaddingConstraints,
  type NumericSettingKey,
  type Orientation,
  type PaperSettings,
  type Pattern,
  type PrintMessageTone,
  type PaperSize,
} from "./model";

interface ControlsPanelProps {
  settings: PaperSettings;
  numericInputs: Record<NumericSettingKey, string>;
  numericValidation: Partial<Record<NumericSettingKey, string>>;
  pagePaddingMax: number;
  isPrinting: boolean;
  printMessage: string;
  printMessageTone: PrintMessageTone;
  onPaperSizeChange: (value: PaperSize) => void;
  onOrientationChange: (value: Orientation) => void;
  onPatternColorChange: (value: string) => void;
  onPatternChange: (value: Pattern) => void;
  onNumericInputChange: (key: NumericSettingKey, value: string) => void;
  onNumericInputCommitted: (key: NumericSettingKey) => void;
  onResetToDefaults: () => void;
  onPrintClick: () => void;
}

export function ControlsPanel({
  settings,
  numericInputs,
  numericValidation,
  pagePaddingMax,
  isPrinting,
  printMessage,
  printMessageTone,
  onPaperSizeChange,
  onOrientationChange,
  onPatternColorChange,
  onPatternChange,
  onNumericInputChange,
  onNumericInputCommitted,
  onResetToDefaults,
  onPrintClick,
}: ControlsPanelProps) {
  return (
    <section className="controls-panel" aria-label="Configuration form panel">
      <h2>Configuration</h2>
      <form className="controls-form">
        <label>
          Paper size
          <select
            value={settings.paperSize}
            onChange={(event) => {
              const selectedPaperSize = event.target.value;
              if (!isPaperSize(selectedPaperSize)) {
                return;
              }

              onPaperSizeChange(selectedPaperSize);
            }}
          >
            <option value="A5">A5</option>
            <option value="A4">A4</option>
            <option value="A3">A3</option>
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

              onOrientationChange(selectedOrientation);
            }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
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

              onPatternColorChange(selectedColor);
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

              onPatternChange(selectedPattern);
            }}
          >
            <option value="dots">Dots</option>
          </select>
        </label>

        <NumericField
          label="Dot width (mm)"
          step={dotWidthConstraints.step}
          min={dotWidthConstraints.min}
          max={dotWidthConstraints.max}
          value={numericInputs.dotWidthMm}
          error={numericValidation.dotWidthMm}
          errorId="dotWidthMm-error"
          onChange={(value) => {
            onNumericInputChange("dotWidthMm", value);
          }}
          onBlur={() => {
            onNumericInputCommitted("dotWidthMm");
          }}
        />

        <NumericField
          label="Dot spacing (mm)"
          step={dotSpacingConstraints.step}
          min={dotSpacingConstraints.min}
          max={dotSpacingConstraints.max}
          value={numericInputs.dotSpacingMm}
          error={numericValidation.dotSpacingMm}
          errorId="dotSpacingMm-error"
          onChange={(value) => {
            onNumericInputChange("dotSpacingMm", value);
          }}
          onBlur={() => {
            onNumericInputCommitted("dotSpacingMm");
          }}
        />

        <NumericField
          label="Page padding (mm)"
          step={pagePaddingConstraints.step}
          min={pagePaddingConstraints.min}
          max={pagePaddingMax}
          value={numericInputs.pagePaddingMm}
          error={numericValidation.pagePaddingMm}
          errorId="pagePaddingMm-error"
          onChange={(value) => {
            onNumericInputChange("pagePaddingMm", value);
          }}
          onBlur={() => {
            onNumericInputCommitted("pagePaddingMm");
          }}
        />

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
      </form>

      {printMessage ? (
        <p className="print-message" data-tone={printMessageTone} role="status">
          {printMessage}
        </p>
      ) : null}
    </section>
  );
}
