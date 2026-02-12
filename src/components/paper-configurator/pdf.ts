import { defaultSettings, isHexColor, resolveDimensions, type PaperSettings } from './model';

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

export const createPdfFileName = (settings: Pick<PaperSettings, 'paperSize' | 'orientation'>) => {
	const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
	return `paper-pattern-${settings.paperSize.toLowerCase()}-${settings.orientation}-${timeStamp}.pdf`;
};

export const drawDotPatternToPdf = async (settings: PaperSettings): Promise<Blob> => {
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
