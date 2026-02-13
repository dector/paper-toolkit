import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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

const getSystemPrefersDark = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function LucideMoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="theme-toggle-icon"
      aria-hidden="true"
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}

function LucideSunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="theme-toggle-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export default function PaperConfigurator() {
  const [state, dispatch] = useReducer(configuratorReducer, initialState);
  const [themeOverride, setThemeOverride] = useState<"light" | "dark" | null>(
    null,
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    getSystemPrefersDark,
  );
  const previewPaperRef = useRef<HTMLDivElement | null>(null);
  const { settings, numericInputs, numericValidation, printMessage } = state;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemPrefersDark(mediaQuery.matches);
    };

    syncSystemTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSystemTheme);
    } else {
      mediaQuery.addListener(syncSystemTheme);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncSystemTheme);
      } else {
        mediaQuery.removeListener(syncSystemTheme);
      }
    };
  }, []);

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

  const activeTheme = themeOverride ?? (systemPrefersDark ? "dark" : "light");

  const handleThemeToggle = () => {
    setThemeOverride((currentOverride) => {
      const currentTheme =
        currentOverride ?? (systemPrefersDark ? "dark" : "light");
      return currentTheme === "dark" ? "light" : "dark";
    });
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
    <main
      className="configurator-page"
      data-theme={themeOverride ?? undefined}
    >
      <div className="configurator-header">
        <div>
          <h1 className="configurator-title">Paper Pattern Configurator</h1>
          <p className="configurator-subtitle">
            Adjust settings on the right and review the page surface on the left.
          </p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={handleThemeToggle}
          aria-pressed={activeTheme === "dark"}
          aria-label={
            activeTheme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {activeTheme === "dark" ? <LucideSunIcon /> : <LucideMoonIcon />}
        </button>
      </div>
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
