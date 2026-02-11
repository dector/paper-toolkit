import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './PaperConfigurator.css';

type PaperSize = 'A4' | 'A3';
type Orientation = 'portrait' | 'landscape';
type Pattern = 'dots';
type NumericSettingKey = 'dotWidthMm' | 'dotSpacingMm' | 'pagePaddingMm';

interface PaperSettings {
	paperSize: PaperSize;
	orientation: Orientation;
	patternColor: string;
	pattern: Pattern;
	dotWidthMm: number;
	dotSpacingMm: number;
	pagePaddingMm: number;
}

interface PaperDimensions {
	widthMm: number;
	heightMm: number;
}

interface PreviewSize {
	widthPx: number;
	heightPx: number;
}

interface ConfiguratorState {
	settings: PaperSettings;
	numericInputs: Record<NumericSettingKey, string>;
	numericValidation: Partial<Record<NumericSettingKey, string>>;
	printMessage: string;
}

type PrintMessageTone = 'info' | 'success' | 'error';

type ConfiguratorAction =
	| { type: 'paperSizeChanged'; value: PaperSize }
	| { type: 'orientationChanged'; value: Orientation }
	| { type: 'patternColorChanged'; value: string }
	| { type: 'patternChanged'; value: Pattern }
	| { type: 'numericInputChanged'; key: NumericSettingKey; value: string }
	| { type: 'numericInputCommitted'; key: NumericSettingKey }
	| { type: 'resetDefaults' }
	| { type: 'printMessageSet'; value: string };

const paperDimensionsMm: Record<PaperSize, PaperDimensions> = {
	A4: { widthMm: 210, heightMm: 297 },
	A3: { widthMm: 297, heightMm: 420 }
};

const dotWidthConstraints = { min: 0.1, max: 10, step: 0.1 };
const dotSpacingConstraints = { min: 1, max: 30, step: 0.1 };
const pagePaddingConstraints = { min: 0, step: 0.1 };
const minimumPrintableEdgeMm = 1;
const paperSizeOptions: PaperSize[] = ['A4', 'A3'];
const orientationOptions: Orientation[] = ['portrait', 'landscape'];
const patternOptions: Pattern[] = ['dots'];

const defaultSettings: PaperSettings = {
	paperSize: 'A4',
	orientation: 'portrait',
	patternColor: '#d3d3d3',
	pattern: 'dots',
	dotWidthMm: 1,
	dotSpacingMm: 5,
	pagePaddingMm: 5
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatMmValue = (value: number) => value.toFixed(1);

const isPaperSize = (value: string): value is PaperSize => paperSizeOptions.includes(value as PaperSize);
const isOrientation = (value: string): value is Orientation =>
	orientationOptions.includes(value as Orientation);
const isPattern = (value: string): value is Pattern => patternOptions.includes(value as Pattern);
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const parseNumericInput = (value: string) => {
	if (value.trim() === '' || value === '-' || value === '.' || value === '-.') {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const colorToRgb = (hexColor: string) => {
	if (!isHexColor(hexColor)) {
		return null;
	}

	const normalizedHex = hexColor.slice(1);
	return {
		r: Number.parseInt(normalizedHex.slice(0, 2), 16),
		g: Number.parseInt(normalizedHex.slice(2, 4), 16),
		b: Number.parseInt(normalizedHex.slice(4, 6), 16)
	};
};

const createPdfFileName = (settings: Pick<PaperSettings, 'paperSize' | 'orientation'>) => {
	const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
	return `paper-pattern-${settings.paperSize.toLowerCase()}-${settings.orientation}-${timeStamp}.pdf`;
};

const drawDotPatternToPdf = async (settings: PaperSettings): Promise<Blob> => {
	const { jsPDF } = await import('jspdf');
	const dimensions = resolveDimensions(settings);
	const pdf = new jsPDF({
		orientation: settings.orientation,
		unit: 'mm',
		format: [dimensions.widthMm, dimensions.heightMm],
		compress: true
	});

	const printableLeftMm = settings.pagePaddingMm;
	const printableTopMm = settings.pagePaddingMm;
	const printableRightMm = dimensions.widthMm - settings.pagePaddingMm;
	const printableBottomMm = dimensions.heightMm - settings.pagePaddingMm;
	const dotRadiusMm = settings.dotWidthMm / 2;
	const dotSpacingMm = settings.dotSpacingMm;

	if (dotRadiusMm <= 0 || dotSpacingMm <= 0) {
		return pdf.output('blob');
	}

	const firstDotX = printableLeftMm + dotRadiusMm;
	const firstDotY = printableTopMm + dotRadiusMm;
	const lastDotX = printableRightMm - dotRadiusMm;
	const lastDotY = printableBottomMm - dotRadiusMm;

	if (firstDotX > lastDotX || firstDotY > lastDotY) {
		return pdf.output('blob');
	}

	const rgbColor = colorToRgb(settings.patternColor) ?? colorToRgb(defaultSettings.patternColor);
	if (rgbColor) {
		pdf.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
	}

	for (let yMm = firstDotY; yMm <= lastDotY + Number.EPSILON; yMm += dotSpacingMm) {
		for (let xMm = firstDotX; xMm <= lastDotX + Number.EPSILON; xMm += dotSpacingMm) {
			pdf.circle(xMm, yMm, dotRadiusMm, 'F');
		}
	}

	return pdf.output('blob');
};

const resolveDimensions = ({ paperSize, orientation }: Pick<PaperSettings, 'paperSize' | 'orientation'>): PaperDimensions => {
	const baseDimensions = paperDimensionsMm[paperSize];
	if (orientation === 'landscape') {
		return { widthMm: baseDimensions.heightMm, heightMm: baseDimensions.widthMm };
	}

	return baseDimensions;
};

const maxPaddingMm = ({ widthMm, heightMm }: PaperDimensions) => {
	const shortestEdge = Math.min(widthMm, heightMm);
	const allowed = (shortestEdge - minimumPrintableEdgeMm) / 2;
	return Number.parseFloat(Math.max(pagePaddingConstraints.min, allowed).toFixed(1));
};

const sanitizeSettings = (settings: PaperSettings): PaperSettings => {
	const dimensions = resolveDimensions(settings);
	const paddingMax = maxPaddingMm(dimensions);

	return {
		...settings,
		dotWidthMm: clamp(settings.dotWidthMm, dotWidthConstraints.min, dotWidthConstraints.max),
		dotSpacingMm: clamp(settings.dotSpacingMm, dotSpacingConstraints.min, dotSpacingConstraints.max),
		pagePaddingMm: clamp(settings.pagePaddingMm, pagePaddingConstraints.min, paddingMax)
	};
};

const getNumericBounds = (settings: PaperSettings, key: NumericSettingKey) => {
	switch (key) {
		case 'dotWidthMm':
			return { min: dotWidthConstraints.min, max: dotWidthConstraints.max };
		case 'dotSpacingMm':
			return { min: dotSpacingConstraints.min, max: dotSpacingConstraints.max };
		case 'pagePaddingMm': {
			const dimensions = resolveDimensions(settings);
			return { min: pagePaddingConstraints.min, max: maxPaddingMm(dimensions) };
		}
	}
};

const toNumericInputs = (settings: PaperSettings): Record<NumericSettingKey, string> => ({
	dotWidthMm: formatMmValue(settings.dotWidthMm),
	dotSpacingMm: formatMmValue(settings.dotSpacingMm),
	pagePaddingMm: formatMmValue(settings.pagePaddingMm)
});

const clearValidationForKey = (
	validation: Partial<Record<NumericSettingKey, string>>,
	key: NumericSettingKey
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

const applySettingsPatch = (state: ConfiguratorState, patch: Partial<PaperSettings>): ConfiguratorState => {
	const nextSettings = sanitizeSettings({ ...state.settings, ...patch });
	const settingsChanged = !areSettingsEqual(state.settings, nextSettings);
	const pagePaddingChanged = nextSettings.pagePaddingMm !== state.settings.pagePaddingMm;

	return {
		...state,
		settings: settingsChanged ? nextSettings : state.settings,
		numericInputs: pagePaddingChanged
			? { ...state.numericInputs, pagePaddingMm: formatMmValue(nextSettings.pagePaddingMm) }
			: state.numericInputs,
		numericValidation: pagePaddingChanged
			? clearValidationForKey(state.numericValidation, 'pagePaddingMm')
			: state.numericValidation,
		printMessage: ''
	};
};

const initialState: ConfiguratorState = {
	settings: defaultSettings,
	numericInputs: toNumericInputs(defaultSettings),
	numericValidation: {},
	printMessage: ''
};

const configuratorReducer = (state: ConfiguratorState, action: ConfiguratorAction): ConfiguratorState => {
	switch (action.type) {
		case 'paperSizeChanged':
			return applySettingsPatch(state, { paperSize: action.value });
		case 'orientationChanged':
			return applySettingsPatch(state, { orientation: action.value });
		case 'patternColorChanged':
			return applySettingsPatch(state, { patternColor: action.value });
		case 'patternChanged':
			return applySettingsPatch(state, { pattern: action.value });
		case 'numericInputChanged': {
			const nextNumericInputs = { ...state.numericInputs, [action.key]: action.value };
			const parsed = parseNumericInput(action.value);

			if (parsed === null) {
				return {
					...state,
					numericInputs: nextNumericInputs,
					numericValidation: {
						...state.numericValidation,
						[action.key]: 'Enter a number to continue.'
					},
					printMessage: ''
				};
			}

			const { min, max } = getNumericBounds(state.settings, action.key);
			const nextValidation =
				parsed < min || parsed > max
					? {
						...state.numericValidation,
						[action.key]: `Allowed range: ${formatMmValue(min)}-${formatMmValue(max)} mm.`
					}
					: clearValidationForKey(state.numericValidation, action.key);
			const nextSettings = sanitizeSettings({ ...state.settings, [action.key]: parsed });

			return {
				...state,
				settings: areSettingsEqual(state.settings, nextSettings) ? state.settings : nextSettings,
				numericInputs: nextNumericInputs,
				numericValidation: nextValidation,
				printMessage: ''
			};
		}
		case 'numericInputCommitted': {
			const parsed = parseNumericInput(state.numericInputs[action.key]);

			if (parsed === null) {
				return {
					...state,
					numericInputs: {
						...state.numericInputs,
						[action.key]: formatMmValue(state.settings[action.key])
					},
					numericValidation: clearValidationForKey(state.numericValidation, action.key)
				};
			}

			const nextSettings = sanitizeSettings({ ...state.settings, [action.key]: parsed });
			return {
				...state,
				settings: areSettingsEqual(state.settings, nextSettings) ? state.settings : nextSettings,
				numericInputs: {
					...state.numericInputs,
					[action.key]: formatMmValue(nextSettings[action.key])
				},
				numericValidation: clearValidationForKey(state.numericValidation, action.key)
			};
		}
		case 'resetDefaults':
			return {
				settings: defaultSettings,
				numericInputs: toNumericInputs(defaultSettings),
				numericValidation: {},
				printMessage: ''
			};
		case 'printMessageSet':
			return {
				...state,
				printMessage: action.value
			};
	}
};

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
			<p className="configurator-subtitle">Adjust settings on the right and review the page surface on the left.</p>
			<div className="configurator-layout">
				<section className="preview-panel" aria-label="Paper preview panel">
					<h2>Preview</h2>
					<div className="preview-stage">
						<div className="preview-paper" ref={previewPaperRef} style={{ aspectRatio: previewRatio }}>
							<div className="preview-printable-area" style={printablePatternStyle} aria-hidden="true" />
							<span className="preview-placeholder">Preview surface</span>
							<div className="preview-meta">
								<span>
									{settings.paperSize} {settings.orientation} ({dimensions.widthMm} x {dimensions.heightMm} mm)
								</span>
								<span>
									Pattern: {settings.pattern} | Color: {settings.patternColor}
								</span>
								<span>
									Scale: {previewScalePxPerMm.toFixed(3)} px/mm | Padding: {settings.pagePaddingMm.toFixed(1)} mm ({paddingPx.toFixed(1)} px)
								</span>
								<span>
									Dot width: {settings.dotWidthMm.toFixed(1)} mm ({dotWidthPx.toFixed(2)} px) | Spacing: {settings.dotSpacingMm.toFixed(1)} mm ({dotSpacingPx.toFixed(2)} px)
								</span>
								<span>
									Printable area: {printableWidthMm.toFixed(1)} x {printableHeightMm.toFixed(1)} mm
								</span>
							</div>
						</div>
					</div>
				</section>

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

									dispatch({ type: 'paperSizeChanged', value: selectedPaperSize });
								}}
							>
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

									dispatch({ type: 'orientationChanged', value: selectedOrientation });
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

									dispatch({ type: 'patternColorChanged', value: selectedColor });
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

									dispatch({ type: 'patternChanged', value: selectedPattern });
								}}
							>
								<option value="dots">Dots</option>
							</select>
						</label>

						<label>
							Dot width (mm)
							<input
								type="number"
								inputMode="decimal"
								step={dotWidthConstraints.step}
								min={dotWidthConstraints.min}
								max={dotWidthConstraints.max}
								value={numericInputs.dotWidthMm}
								aria-invalid={Boolean(numericValidation.dotWidthMm)}
								aria-describedby={numericValidation.dotWidthMm ? 'dotWidthMm-error' : undefined}
								onChange={(event) => {
									dispatch({ type: 'numericInputChanged', key: 'dotWidthMm', value: event.target.value });
								}}
								onBlur={() => {
									dispatch({ type: 'numericInputCommitted', key: 'dotWidthMm' });
								}}
							/>
							{numericValidation.dotWidthMm ? (
								<span id="dotWidthMm-error" className="field-validation-message" role="status">
									{numericValidation.dotWidthMm}
								</span>
							) : null}
						</label>

						<label>
							Dot spacing (mm)
							<input
								type="number"
								inputMode="decimal"
								step={dotSpacingConstraints.step}
								min={dotSpacingConstraints.min}
								max={dotSpacingConstraints.max}
								value={numericInputs.dotSpacingMm}
								aria-invalid={Boolean(numericValidation.dotSpacingMm)}
								aria-describedby={numericValidation.dotSpacingMm ? 'dotSpacingMm-error' : undefined}
								onChange={(event) => {
									dispatch({ type: 'numericInputChanged', key: 'dotSpacingMm', value: event.target.value });
								}}
								onBlur={() => {
									dispatch({ type: 'numericInputCommitted', key: 'dotSpacingMm' });
								}}
							/>
							{numericValidation.dotSpacingMm ? (
								<span id="dotSpacingMm-error" className="field-validation-message" role="status">
									{numericValidation.dotSpacingMm}
								</span>
							) : null}
						</label>

						<label>
							Page padding (mm)
							<input
								type="number"
								inputMode="decimal"
								step={pagePaddingConstraints.step}
								min={pagePaddingConstraints.min}
								max={pagePaddingMax}
								value={numericInputs.pagePaddingMm}
								aria-invalid={Boolean(numericValidation.pagePaddingMm)}
								aria-describedby={numericValidation.pagePaddingMm ? 'pagePaddingMm-error' : undefined}
								onChange={(event) => {
									dispatch({ type: 'numericInputChanged', key: 'pagePaddingMm', value: event.target.value });
								}}
								onBlur={() => {
									dispatch({ type: 'numericInputCommitted', key: 'pagePaddingMm' });
								}}
							/>
							{numericValidation.pagePaddingMm ? (
								<span id="pagePaddingMm-error" className="field-validation-message" role="status">
									{numericValidation.pagePaddingMm}
								</span>
							) : null}
						</label>

						<div className="controls-actions">
							<button type="button" className="button-secondary" onClick={resetToDefaults}>
								Reset
							</button>
							<button type="button" onClick={handlePrintClick} disabled={isPrinting}>
								{isPrinting ? 'Preparing...' : 'Print'}
							</button>
						</div>
					</form>

					{printMessage ? (
						<p className="print-message" data-tone={printMessageTone} role="status">
							{printMessage}
						</p>
					) : null}
				</section>
			</div>
		</main>
	);
}
