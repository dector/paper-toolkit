import { useCallback, useEffect, useRef, useState } from "react";
import { createPdfFileName, drawDotPatternToPdf } from "./pdf";
import type { PaperSettings, PrintMessageTone } from "./model";

interface UsePrintWorkflowOptions {
  settings: PaperSettings;
  setPrintMessage: (value: string) => void;
}

interface UsePrintWorkflowResult {
  isPrinting: boolean;
  printMessageTone: PrintMessageTone;
  handlePrintClick: () => void;
}

export const usePrintWorkflow = ({
  settings,
  setPrintMessage,
}: UsePrintWorkflowOptions): UsePrintWorkflowResult => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMessageTone, setPrintMessageTone] =
    useState<PrintMessageTone>("info");
  const pdfBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
    };
  }, []);

  const handlePrintClick = useCallback(() => {
    if (isPrinting) {
      return;
    }

    const runPrint = async () => {
      setIsPrinting(true);
      setPrintMessageTone("info");
      setPrintMessage("Generating PDF...");

      try {
        const pdfBlob = await drawDotPatternToPdf(settings);
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        if (pdfBlobUrlRef.current) {
          URL.revokeObjectURL(pdfBlobUrlRef.current);
        }

        pdfBlobUrlRef.current = pdfBlobUrl;
        const openedWindow = window.open(pdfBlobUrl, "_blank");

        if (openedWindow) {
          const requestPrint = () => {
            try {
              openedWindow.focus();
              openedWindow.print();
            } catch {
              // Some browsers block print calls on new tabs.
            }
          };

          openedWindow.addEventListener("load", requestPrint, { once: true });
          window.setTimeout(requestPrint, 700);
          window.setTimeout(
            () => {
              if (pdfBlobUrlRef.current === pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                pdfBlobUrlRef.current = null;
              }
            },
            5 * 60 * 1000,
          );

          setPrintMessageTone("success");
          setPrintMessage(
            "PDF opened in a new tab. If print dialog does not appear, use browser print or download controls.",
          );
        } else {
          const downloadLink = document.createElement("a");
          downloadLink.href = pdfBlobUrl;
          downloadLink.download = createPdfFileName(settings);
          downloadLink.rel = "noopener";
          document.body.append(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.setTimeout(() => {
            if (pdfBlobUrlRef.current === pdfBlobUrl) {
              URL.revokeObjectURL(pdfBlobUrl);
              pdfBlobUrlRef.current = null;
            }
          }, 1000);

          setPrintMessageTone("info");
          setPrintMessage("Popup was blocked. The PDF was downloaded instead.");
        }
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        setPrintMessageTone("error");
        setPrintMessage(
          "Unable to generate PDF. Please try again or adjust settings.",
        );
      } finally {
        setIsPrinting(false);
      }
    };

    void runPrint();
  }, [isPrinting, setPrintMessage, settings]);

  return {
    isPrinting,
    printMessageTone,
    handlePrintClick,
  };
};
