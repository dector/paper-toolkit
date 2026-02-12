import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './PaperConfigurator.css';
import { ControlsPanel } from './paper-configurator/ControlsPanel';
import { drawDotPatternToPdf, createPdfFileName } from './paper-configurator/pdf';
import { PreviewPanel } from './paper-configurator/PreviewPanel';
import {
	configuratorReducer,
	initialState,
	maxPaddingMm,
	resolveDimensions,
	type PreviewSize,
	type PrintMessageTone
} from './paper-configurator/model';

export default function PaperConfigurator() {
	const [state, dispatch] = useReducer(configuratorReducer, initialState);
	const [previewSize, setPreviewSize] = useState<PreviewSize>({ widthPx: 0, heightPx: 0 });
	const [printMessageTone, setPrintMessageTone] = useState<PrintMessageTone>('info');
	const [isPrinting, setIsPrinting] = useState(false);
	const previewPaperRef = useRef<HTMLDivElement | null>(null);
	const pdfBlobUrlRef = useRef<string | null>(null);
	const { settings, numericInputs, numericValidation, printMessage } = state;

	const dimensions = useMemo(() => resolveDimensions(settings), [settings.paperSize, settings.orientation]);
	const previewRatio = `${dimensions.widthMm} / ${dimensions.heightMm}`;
	const pagePaddingMax = maxPaddingMm(dimensions);

	const previewScalePxPerMm =
		previewSize.widthPx > 0 && previewSize.heightPx > 0
			? Math.min(previewSize.widthPx / dimensions.widthMm, previewSize.heightPx / dimensions.heightMm)
			: 0;

	const paddingPx = settings.pagePaddingMm * previewScalePxPerMm;
	const dotWidthPx = settings.dotWidthMm * previewScalePxPerMm;
	const dotSpacingPx = settings.dotSpacingMm * previewScalePxPerMm;
	const printableWidthMm = Math.max(0, dimensions.widthMm - settings.pagePaddingMm * 2);
	const printableHeightMm = Math.max(0, dimensions.heightMm - settings.pagePaddingMm * 2);
	const dotRadiusPx = Math.max(dotWidthPx / 2, 0);
	const hasPreviewPattern = previewScalePxPerMm > 0 && dotSpacingPx > 0 && dotRadiusPx > 0;

	const printablePatternStyle = hasPreviewPattern
		? {
				inset: `${paddingPx}px`,
				backgroundImage: `radial-gradient(circle, ${settings.patternColor} 0 ${dotRadiusPx.toFixed(3)}px, transparent ${dotRadiusPx.toFixed(3)}px)`,
				backgroundSize: `${dotSpacingPx.toFixed(3)}px ${dotSpacingPx.toFixed(3)}px`
			}
		: {
				inset: `${paddingPx}px`
			};

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
				heightPx: entry.contentRect.height
			});
		});

		resizeObserver.observe(paperElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	useEffect(() => {
		return () => {
			if (pdfBlobUrlRef.current) {
				URL.revokeObjectURL(pdfBlobUrlRef.current);
			}
		};
	}, []);

	const resetToDefaults = () => {
		dispatch({ type: 'resetDefaults' });
	};

	const handlePrintClick = async () => {
		if (isPrinting) {
			return;
		}

		setIsPrinting(true);
		setPrintMessageTone('info');
		dispatch({ type: 'printMessageSet', value: 'Generating PDF...' });

		try {
			const pdfBlob = await drawDotPatternToPdf(settings);
			const pdfBlobUrl = URL.createObjectURL(pdfBlob);

			if (pdfBlobUrlRef.current) {
				URL.revokeObjectURL(pdfBlobUrlRef.current);
			}

			pdfBlobUrlRef.current = pdfBlobUrl;
			const openedWindow = window.open(pdfBlobUrl, '_blank');

			if (openedWindow) {
				const requestPrint = () => {
					try {
						openedWindow.focus();
						openedWindow.print();
					} catch {
						// Some browsers block print calls on new tabs.
					}
				};

				openedWindow.addEventListener('load', requestPrint, { once: true });
				window.setTimeout(requestPrint, 700);
				window.setTimeout(() => {
					if (pdfBlobUrlRef.current === pdfBlobUrl) {
						URL.revokeObjectURL(pdfBlobUrl);
						pdfBlobUrlRef.current = null;
					}
				}, 5 * 60 * 1000);

				setPrintMessageTone('success');
				dispatch({
					type: 'printMessageSet',
					value: 'PDF opened in a new tab. If print dialog does not appear, use browser print or download controls.'
				});
			} else {
				const downloadLink = document.createElement('a');
				downloadLink.href = pdfBlobUrl;
				downloadLink.download = createPdfFileName(settings);
				downloadLink.rel = 'noopener';
				document.body.append(downloadLink);
				downloadLink.click();
				downloadLink.remove();
				window.setTimeout(() => {
					if (pdfBlobUrlRef.current === pdfBlobUrl) {
						URL.revokeObjectURL(pdfBlobUrl);
						pdfBlobUrlRef.current = null;
					}
				}, 1000);

				setPrintMessageTone('info');
				dispatch({
					type: 'printMessageSet',
					value: 'Popup was blocked. The PDF was downloaded instead.'
				});
			}
		} catch (error) {
			console.error('Failed to generate PDF:', error);
			setPrintMessageTone('error');
			dispatch({
				type: 'printMessageSet',
				value: 'Unable to generate PDF. Please try again or adjust settings.'
			});
		} finally {
			setIsPrinting(false);
		}
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
					previewRatio={previewRatio}
					previewPaperRef={previewPaperRef}
					printablePatternStyle={printablePatternStyle}
					previewScalePxPerMm={previewScalePxPerMm}
					paddingPx={paddingPx}
					dotWidthPx={dotWidthPx}
					dotSpacingPx={dotSpacingPx}
					printableWidthMm={printableWidthMm}
					printableHeightMm={printableHeightMm}
				/>

				<ControlsPanel
					settings={settings}
					numericInputs={numericInputs}
					numericValidation={numericValidation}
					pagePaddingMax={pagePaddingMax}
					isPrinting={isPrinting}
					printMessage={printMessage}
					printMessageTone={printMessageTone}
					onPaperSizeChange={(value) => {
						dispatch({ type: 'paperSizeChanged', value });
					}}
					onOrientationChange={(value) => {
						dispatch({ type: 'orientationChanged', value });
					}}
					onPatternColorChange={(value) => {
						dispatch({ type: 'patternColorChanged', value });
					}}
					onPatternChange={(value) => {
						dispatch({ type: 'patternChanged', value });
					}}
					onNumericInputChange={(key, value) => {
						dispatch({ type: 'numericInputChanged', key, value });
					}}
					onNumericInputCommitted={(key) => {
						dispatch({ type: 'numericInputCommitted', key });
					}}
					onResetToDefaults={resetToDefaults}
					onPrintClick={handlePrintClick}
				/>
			</div>
		</main>
	);
}
