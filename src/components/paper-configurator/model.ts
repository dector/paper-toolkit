export type PaperSize = "A5" | "A4" | "A3";
export type Orientation = "portrait" | "landscape";
export type Pattern = "dots";
export type NumericSettingKey = "dotWidthMm" | "dotSpacingMm" | "pagePaddingMm";

export interface PaperSettings {
  paperSize: PaperSize;
  orientation: Orientation;
  patternColor: string;
  pattern: Pattern;
  dotWidthMm: number;
  dotSpacingMm: number;
  pagePaddingMm: number;
}

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export interface PreviewSize {
  widthPx: number;
  heightPx: number;
}

export interface ConfiguratorState {
  settings: PaperSettings;
  numericInputs: Record<NumericSettingKey, string>;
  numericValidation: Partial<Record<NumericSettingKey, string>>;
  printMessage: string;
}

export type PrintMessageTone = "info" | "success" | "error";

export type ConfiguratorAction =
  | { type: "paperSizeChanged"; value: PaperSize }
  | { type: "orientationChanged"; value: Orientation }
  | { type: "patternColorChanged"; value: string }
  | { type: "patternChanged"; value: Pattern }
  | { type: "numericInputChanged"; key: NumericSettingKey; value: string }
  | { type: "numericInputCommitted"; key: NumericSettingKey }
  | { type: "resetDefaults" }
  | { type: "printMessageSet"; value: string };

export const paperDimensionsMm: Record<PaperSize, PaperDimensions> = {
  A5: { widthMm: 148, heightMm: 210 },
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
};

export const dotWidthConstraints = { min: 0.1, max: 10, step: 0.1 };
export const dotSpacingConstraints = { min: 1, max: 30, step: 0.1 };
export const pagePaddingConstraints = { min: 0, step: 0.1 };
const minimumPrintableEdgeMm = 1;
export const paperSizeOptions: PaperSize[] = ["A5", "A4", "A3"];
export const orientationOptions: Orientation[] = ["portrait", "landscape"];
export const patternOptions: Pattern[] = ["dots"];

export const defaultSettings: PaperSettings = {
  paperSize: "A4",
  orientation: "portrait",
  patternColor: "#d3d3d3",
  pattern: "dots",
  dotWidthMm: 1,
  dotSpacingMm: 5,
  pagePaddingMm: 5,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
export const formatMmValue = (value: number) => value.toFixed(1);

export const isPaperSize = (value: string): value is PaperSize =>
  paperSizeOptions.includes(value as PaperSize);
export const isOrientation = (value: string): value is Orientation =>
  orientationOptions.includes(value as Orientation);
export const isPattern = (value: string): value is Pattern =>
  patternOptions.includes(value as Pattern);
export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const parseNumericInput = (value: string) => {
  if (value.trim() === "" || value === "-" || value === "." || value === "-.") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const resolveDimensions = ({
  paperSize,
  orientation,
}: Pick<PaperSettings, "paperSize" | "orientation">): PaperDimensions => {
  const baseDimensions = paperDimensionsMm[paperSize];
  if (orientation === "landscape") {
    return {
      widthMm: baseDimensions.heightMm,
      heightMm: baseDimensions.widthMm,
    };
  }

  return baseDimensions;
};

export const maxPaddingMm = ({ widthMm, heightMm }: PaperDimensions) => {
  const shortestEdge = Math.min(widthMm, heightMm);
  const allowed = (shortestEdge - minimumPrintableEdgeMm) / 2;
  return Number.parseFloat(
    Math.max(pagePaddingConstraints.min, allowed).toFixed(1),
  );
};

const sanitizeSettings = (settings: PaperSettings): PaperSettings => {
  const dimensions = resolveDimensions(settings);
  const paddingMax = maxPaddingMm(dimensions);

  return {
    ...settings,
    dotWidthMm: clamp(
      settings.dotWidthMm,
      dotWidthConstraints.min,
      dotWidthConstraints.max,
    ),
    dotSpacingMm: clamp(
      settings.dotSpacingMm,
      dotSpacingConstraints.min,
      dotSpacingConstraints.max,
    ),
    pagePaddingMm: clamp(
      settings.pagePaddingMm,
      pagePaddingConstraints.min,
      paddingMax,
    ),
  };
};

const getNumericBounds = (settings: PaperSettings, key: NumericSettingKey) => {
  switch (key) {
    case "dotWidthMm":
      return { min: dotWidthConstraints.min, max: dotWidthConstraints.max };
    case "dotSpacingMm":
      return { min: dotSpacingConstraints.min, max: dotSpacingConstraints.max };
    case "pagePaddingMm": {
      const dimensions = resolveDimensions(settings);
      return { min: pagePaddingConstraints.min, max: maxPaddingMm(dimensions) };
    }
  }
};

const toNumericInputs = (
  settings: PaperSettings,
): Record<NumericSettingKey, string> => ({
  dotWidthMm: formatMmValue(settings.dotWidthMm),
  dotSpacingMm: formatMmValue(settings.dotSpacingMm),
  pagePaddingMm: formatMmValue(settings.pagePaddingMm),
});

const clearValidationForKey = (
  validation: Partial<Record<NumericSettingKey, string>>,
  key: NumericSettingKey,
) => {
  if (!validation[key]) {
    return validation;
  }

  const nextValidation = { ...validation };
  delete nextValidation[key];
  return nextValidation;
};

const areSettingsEqual = (left: PaperSettings, right: PaperSettings) =>
  left.paperSize === right.paperSize &&
  left.orientation === right.orientation &&
  left.patternColor === right.patternColor &&
  left.pattern === right.pattern &&
  left.dotWidthMm === right.dotWidthMm &&
  left.dotSpacingMm === right.dotSpacingMm &&
  left.pagePaddingMm === right.pagePaddingMm;

const applySettingsPatch = (
  state: ConfiguratorState,
  patch: Partial<PaperSettings>,
): ConfiguratorState => {
  const nextSettings = sanitizeSettings({ ...state.settings, ...patch });
  const settingsChanged = !areSettingsEqual(state.settings, nextSettings);
  const pagePaddingChanged =
    nextSettings.pagePaddingMm !== state.settings.pagePaddingMm;

  return {
    ...state,
    settings: settingsChanged ? nextSettings : state.settings,
    numericInputs: pagePaddingChanged
      ? {
          ...state.numericInputs,
          pagePaddingMm: formatMmValue(nextSettings.pagePaddingMm),
        }
      : state.numericInputs,
    numericValidation: pagePaddingChanged
      ? clearValidationForKey(state.numericValidation, "pagePaddingMm")
      : state.numericValidation,
    printMessage: "",
  };
};

export const initialState: ConfiguratorState = {
  settings: defaultSettings,
  numericInputs: toNumericInputs(defaultSettings),
  numericValidation: {},
  printMessage: "",
};

export const configuratorReducer = (
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState => {
  switch (action.type) {
    case "paperSizeChanged":
      return applySettingsPatch(state, { paperSize: action.value });
    case "orientationChanged":
      return applySettingsPatch(state, { orientation: action.value });
    case "patternColorChanged":
      return applySettingsPatch(state, { patternColor: action.value });
    case "patternChanged":
      return applySettingsPatch(state, { pattern: action.value });
    case "numericInputChanged": {
      const nextNumericInputs = {
        ...state.numericInputs,
        [action.key]: action.value,
      };
      const parsed = parseNumericInput(action.value);

      if (parsed === null) {
        return {
          ...state,
          numericInputs: nextNumericInputs,
          numericValidation: {
            ...state.numericValidation,
            [action.key]: "Enter a number to continue.",
          },
          printMessage: "",
        };
      }

      const { min, max } = getNumericBounds(state.settings, action.key);
      const nextValidation =
        parsed < min || parsed > max
          ? {
              ...state.numericValidation,
              [action.key]: `Allowed range: ${formatMmValue(min)}-${formatMmValue(max)} mm.`,
            }
          : clearValidationForKey(state.numericValidation, action.key);
      const nextSettings = sanitizeSettings({
        ...state.settings,
        [action.key]: parsed,
      });

      return {
        ...state,
        settings: areSettingsEqual(state.settings, nextSettings)
          ? state.settings
          : nextSettings,
        numericInputs: nextNumericInputs,
        numericValidation: nextValidation,
        printMessage: "",
      };
    }
    case "numericInputCommitted": {
      const parsed = parseNumericInput(state.numericInputs[action.key]);

      if (parsed === null) {
        return {
          ...state,
          numericInputs: {
            ...state.numericInputs,
            [action.key]: formatMmValue(state.settings[action.key]),
          },
          numericValidation: clearValidationForKey(
            state.numericValidation,
            action.key,
          ),
        };
      }

      const nextSettings = sanitizeSettings({
        ...state.settings,
        [action.key]: parsed,
      });
      return {
        ...state,
        settings: areSettingsEqual(state.settings, nextSettings)
          ? state.settings
          : nextSettings,
        numericInputs: {
          ...state.numericInputs,
          [action.key]: formatMmValue(nextSettings[action.key]),
        },
        numericValidation: clearValidationForKey(
          state.numericValidation,
          action.key,
        ),
      };
    }
    case "resetDefaults":
      return {
        settings: defaultSettings,
        numericInputs: toNumericInputs(defaultSettings),
        numericValidation: {},
        printMessage: "",
      };
    case "printMessageSet":
      return {
        ...state,
        printMessage: action.value,
      };
  }
};
