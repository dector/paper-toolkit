import { useState } from 'react';
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

const defaultSettings: PaperSettings = {
	paperSize: 'A4',
	orientation: 'portrait',
	patternColor: '#d3d3d3',
	pattern: 'dots',
	dotWidthMm: 1,
	dotSpacingMm: 5,
	pagePaddingMm: 5
};

export default function PaperConfigurator() {
	const [settings, setSettings] = useState<PaperSettings>(defaultSettings);
	const [printMessage, setPrintMessage] = useState<string>('');

	const previewIsLandscape = settings.orientation === 'landscape';
	const previewRatio =
		settings.paperSize === 'A3'
			? previewIsLandscape
				? '420 / 297'
				: '297 / 420'
			: previewIsLandscape
				? '297 / 210'
				: '210 / 297';

	const updateNumber = (key: 'dotWidthMm' | 'dotSpacingMm' | 'pagePaddingMm', value: string) => {
		const parsed = Number.parseFloat(value);
		setSettings((current) => ({
			...current,
			[key]: Number.isNaN(parsed) ? 0 : parsed
		}));
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
						<div className="preview-paper" style={{ aspectRatio: previewRatio }}>
							<span className="preview-placeholder">Preview surface</span>
							<div className="preview-meta">
								<span>
									{settings.paperSize} {settings.orientation}
								</span>
								<span>
									Pattern: {settings.pattern} | Color: {settings.patternColor}
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
									setSettings((current) => ({ ...current, paperSize: event.target.value as PaperSize }));
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
									setSettings((current) => ({
										...current,
										orientation: event.target.value as Orientation
									}));
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
								step="0.1"
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
								step="0.1"
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
								step="0.1"
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
