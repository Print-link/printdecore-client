import type { ReactNode } from 'react';
import { KIND_ACCENT, type FileKind } from '../../utils/files';

interface FileTypeIconProps {
	kind: FileKind;
	/** Shown on the band, e.g. "PDF" */
	ext: string;
	/** Width in px; height follows the page shape */
	size?: number;
	dark?: boolean;
	className?: string;
}

/** Text lines on the page */
const Lines = ({ y, rows, ink }: { y: number; rows: number[]; ink: string }) => (
	<g fill={ink}>
		{rows.map((w, i) => (
			<rect key={i} x={11} y={y + i * 3.6} width={w} height={1.6} rx={0.8} />
		))}
	</g>
);

/**
 * A sheet of paper with a folded corner, a drawing of what's inside and a
 * coloured band with the extension — so a PDF, a spreadsheet or an artwork
 * file reads as one at a glance.
 */
export function FileTypeIcon({ kind, ext, size = 40, dark = false, className }: FileTypeIconProps) {
	const accent = KIND_ACCENT[kind];
	const paper = dark ? '#1F2937' : '#FFFFFF';
	const edge = dark ? '#4B5563' : '#D1D5DB';
	const fold = dark ? '#374151' : '#E5E7EB';
	const ink = dark ? '#6B7280' : '#CBD5E1';
	const label = ext.slice(0, 4);

	let art: ReactNode;
	switch (kind) {
		case 'pdf':
			art = (
				<>
					<rect x={11} y={10} width={10} height={2.2} rx={1.1} fill={accent} />
					<Lines y={15} rows={[19, 16, 19, 12]} ink={ink} />
				</>
			);
			break;
		case 'doc':
			art = <Lines y={10} rows={[19, 19, 15, 19, 10]} ink={ink} />;
			break;
		case 'image':
			art = (
				<g>
					<rect x={11} y={10} width={19} height={15} rx={1.5} fill={accent} opacity={0.12} />
					<circle cx={25.5} cy={14} r={2} fill={accent} opacity={0.8} />
					<path d="M11 25 L17 17.5 L21 22 L24 19 L30 25 Z" fill={accent} />
				</g>
			);
			break;
		case 'sheet':
			art = (
				<g stroke={accent} strokeWidth={0.9} fill="none">
					<rect x={11} y={10} width={19} height={15} rx={1} fill={accent} fillOpacity={0.08} />
					<path d="M11 15 H30 M11 20 H30 M17.5 10 V25 M23.5 10 V25" />
					<rect x={11} y={10} width={19} height={5} fill={accent} fillOpacity={0.25} stroke="none" />
				</g>
			);
			break;
		case 'slides':
			art = (
				<g>
					<rect x={11} y={10} width={19} height={14} rx={1.2} fill="none" stroke={accent} strokeWidth={1} />
					<rect x={14} y={18} width={2.6} height={4} fill={accent} />
					<rect x={18.2} y={15} width={2.6} height={7} fill={accent} />
					<rect x={22.4} y={16.5} width={2.6} height={5.5} fill={accent} opacity={0.6} />
					<path d="M20.5 24 V26.5" stroke={accent} strokeWidth={1} />
				</g>
			);
			break;
		case 'design':
			art = (
				<g>
					<path d="M12 24 C14 12, 26 12, 29 22" fill="none" stroke={accent} strokeWidth={1.2} />
					<path d="M12 24 L18 13" stroke={ink} strokeWidth={0.6} />
					<path d="M29 22 L25 12" stroke={ink} strokeWidth={0.6} />
					<rect x={10.6} y={22.6} width={2.8} height={2.8} fill={paper} stroke={accent} strokeWidth={0.8} />
					<rect x={27.6} y={20.6} width={2.8} height={2.8} fill={paper} stroke={accent} strokeWidth={0.8} />
					<circle cx={18} cy={13} r={1.2} fill={accent} />
					<circle cx={25} cy={12} r={1.2} fill={accent} />
				</g>
			);
			break;
		case 'archive':
			art = (
				<g fill={accent}>
					{[0, 1, 2, 3, 4].map((i) => (
						<rect key={i} x={i % 2 ? 20.5 : 18} y={8 + i * 3} width={2.5} height={2} rx={0.4} />
					))}
					<rect x={17.5} y={23.5} width={6} height={4.5} rx={1} fill="none" stroke={accent} strokeWidth={1} />
				</g>
			);
			break;
		default:
			art = <Lines y={11} rows={[17, 19, 13]} ink={ink} />;
	}

	return (
		<svg
			width={size}
			height={(size * 48) / 40}
			viewBox="0 0 40 48"
			className={className}
			role="img"
			aria-label={`${label} file`}
		>
			{/* soft shadow under the page */}
			<path d="M8 4 H28 L37 13 V45 A2 2 0 0 1 35 47 H8 A2 2 0 0 1 6 45 V6" fill="#000" opacity={dark ? 0.25 : 0.06} transform="translate(0.6 0.8)" />
			{/* the page */}
			<path d="M8 1.5 H27 L36.5 11 V44 A2.5 2.5 0 0 1 34 46.5 H8 A2.5 2.5 0 0 1 5.5 44 V4 A2.5 2.5 0 0 1 8 1.5 Z" fill={paper} stroke={edge} strokeWidth={1} />
			{/* folded corner */}
			<path d="M27 1.5 V8.5 A2.5 2.5 0 0 0 29.5 11 H36.5 Z" fill={fold} stroke={edge} strokeWidth={1} strokeLinejoin="round" />
			{art}
			{/* extension band, standing slightly proud of the page */}
			<rect x={2} y={31} width={label.length > 3 ? 30 : 26} height={11} rx={2} fill={accent} />
			<text
				x={2 + (label.length > 3 ? 15 : 13)}
				y={38.9}
				textAnchor="middle"
				fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
				fontSize={label.length > 3 ? 6.6 : 7.4}
				fontWeight={800}
				letterSpacing={0.4}
				fill="#FFFFFF"
			>
				{label}
			</text>
		</svg>
	);
}
