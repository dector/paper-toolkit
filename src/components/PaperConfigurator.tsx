import { useEffect, useMemo, useRef, useState } from 'react';
import './PaperConfigurator.css';

type PaperSize = 'A4' | 'A3';
type Orientation = 'portrait' | 'landscape';
type Pattern = 'dots';

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

const paperDimensionsMm: Record<PaperSize, PaperDimensions> = {
	A4: { widthMm: 210, heightMm: 297 },
	A3: { widthMm: 297, heightMm: 420 }
};

const dotWidthConstraints = { min: 0.1, max: 10, step: 0.1 };
const dotSpacingConstraints = { min: 1, max: 30, step: 0.1 };
const pagePaddingConstraints = { min: 0, step: 0.1 };
const minimumPrintableEdgeMm = 1;

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

export default function PaperConfigurator() {
	const [settings, setSettings] = useState<PaperSettings>(defaultSettings);
	const [printMessage, setPrintMessage] = useState<string>('');
	const [previewSize, setPreviewSize] = useState<PreviewSize>({ widthPx: 0, heightPx: 0 });
	const previewPaperRef = useRef<HTMLDivElement | null>(null);

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

	const updateNumber = (key: 'dotWidthMm' | 'dotSpacingMm' | 'pagePaddingMm', value: string) => {
		const parsed = Number.parseFloat(value);
		setSettings((current) =>
			sanitizeSettings({
				...current,
				[key]: Number.isNaN(parsed) ? 0 : parsed
			})
		);
	};

	const handlePrintClick = () => {
		// TODO: Replace with PDF generation + print flow in the PDF milestone.
		setPrintMessage('Print placeholder: PDF generation is deferred to a later milestone.');
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
									setSettings((current) =>
										sanitizeSettings({ ...current, paperSize: event.target.value as PaperSize })
									);
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
									setSettings((current) =>
										sanitizeSettings({
											...current,
											orientation: event.target.value as Orientation
										})
									);
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
									setSettings((current) => ({ ...current, patternColor: event.target.value }));
								}}
							/>
						</label>

						<label>
							Pattern
							<select
								value={settings.pattern}
								onChange={(event) => {
									setSettings((current) => ({ ...current, pattern: event.target.value as Pattern }));
								}}
							>
								<option value="dots">Dots</option>
							</select>
						</label>

						<label>
							Dot width (mm)
							<input
								type="number"
								step={dotWidthConstraints.step}
								min={dotWidthConstraints.min}
								max={dotWidthConstraints.max}
								value={settings.dotWidthMm}
								onChange={(event) => {
									updateNumber('dotWidthMm', event.target.value);
								}}
							/>
						</label>

						<label>
							Dot spacing (mm)
							<input
								type="number"
								step={dotSpacingConstraints.step}
								min={dotSpacingConstraints.min}
								max={dotSpacingConstraints.max}
								value={settings.dotSpacingMm}
								onChange={(event) => {
									updateNumber('dotSpacingMm', event.target.value);
								}}
							/>
						</label>

						<label>
							Page padding (mm)
							<input
								type="number"
								step={pagePaddingConstraints.step}
								min={pagePaddingConstraints.min}
								max={pagePaddingMax}
								value={settings.pagePaddingMm}
								onChange={(event) => {
									updateNumber('pagePaddingMm', event.target.value);
								}}
							/>
						</label>

						<button type="button" onClick={handlePrintClick}>
							Print
						</button>
					</form>

					{printMessage ? <p className="print-message">{printMessage}</p> : null}
				</section>
			</div>
		</main>
	);
}
