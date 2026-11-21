/**
 * Printy — the Print Assistant's mascot: a friendly printer with a face.
 * Drawn in SVG with soft gradients and highlights so it reads as 3D, and
 * animated in CSS (see `.printy-*` in index.css): it floats, blinks, glances
 * around, waves, and prints a page. Motion stops for people who ask for less.
 */
export const PrintyMascot = ({ className = "" }: { className?: string }) => (
	<svg viewBox="0 0 220 220" className={className} role="img" aria-label="Printy, the print assistant">
		<defs>
			<linearGradient id="printy-body" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffe27a" />
				<stop offset="0.55" stopColor="#fbbf24" />
				<stop offset="1" stopColor="#d98a06" />
			</linearGradient>
			<linearGradient id="printy-top" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#3a3a3a" />
				<stop offset="1" stopColor="#151515" />
			</linearGradient>
			<radialGradient id="printy-screen" cx="0.4" cy="0.3" r="0.9">
				<stop offset="0" stopColor="#2b2b2b" />
				<stop offset="1" stopColor="#0b0b0b" />
			</radialGradient>
			<linearGradient id="printy-paper" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffffff" />
				<stop offset="1" stopColor="#eef0f3" />
			</linearGradient>
			<radialGradient id="printy-shadow" cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stopColor="#000" stopOpacity="0.35" />
				<stop offset="1" stopColor="#000" stopOpacity="0" />
			</radialGradient>
			<radialGradient id="printy-cheek" cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stopColor="#ff7a59" stopOpacity="0.75" />
				<stop offset="1" stopColor="#ff7a59" stopOpacity="0" />
			</radialGradient>
		</defs>

		{/* Ground shadow breathes with the float */}
		<ellipse className="printy-shadow" cx="110" cy="200" rx="62" ry="9" fill="url(#printy-shadow)" />

		<g className="printy-float">
			{/* Waving arm (behind the body) */}
			<g className="printy-wave">
				<path d="M172 118 q22 -6 26 -30" stroke="#d98a06" strokeWidth="9" strokeLinecap="round" fill="none" />
				<circle cx="198" cy="86" r="9" fill="url(#printy-body)" stroke="#c27a05" strokeWidth="1.5" />
			</g>
			{/* Resting arm */}
			<path d="M48 124 q-16 10 -14 26" stroke="#d98a06" strokeWidth="9" strokeLinecap="round" fill="none" />
			<circle cx="34" cy="152" r="8.5" fill="url(#printy-body)" stroke="#c27a05" strokeWidth="1.5" />

			{/* Paper going in at the top */}
			<rect x="74" y="34" width="72" height="30" rx="4" fill="url(#printy-paper)" stroke="#d7dbe0" />
			<rect x="84" y="42" width="34" height="4" rx="2" fill="#fbbf24" />
			<rect x="84" y="50" width="48" height="3" rx="1.5" fill="#cfd4da" />

			{/* Top lid */}
			<rect x="52" y="56" width="116" height="22" rx="11" fill="url(#printy-top)" />
			<rect x="60" y="59" width="100" height="4" rx="2" fill="#ffffff" opacity="0.12" />

			{/* Body */}
			<rect x="44" y="70" width="132" height="96" rx="28" fill="url(#printy-body)" />
			{/* Soft 3D highlights */}
			<path d="M58 84 q4 -10 18 -12 h60" stroke="#fff6cc" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
			<ellipse cx="156" cy="150" rx="14" ry="8" fill="#b86f04" opacity="0.25" />

			{/* Face screen */}
			<rect x="66" y="86" width="88" height="50" rx="18" fill="url(#printy-screen)" />
			<rect x="72" y="90" width="40" height="6" rx="3" fill="#ffffff" opacity="0.08" />

			{/* Eyes: glance around and blink */}
			<g className="printy-look">
				<g className="printy-blink">
					<ellipse cx="93" cy="110" rx="7" ry="9" fill="#ffd54a" />
					<ellipse cx="127" cy="110" rx="7" ry="9" fill="#ffd54a" />
					<circle cx="95.5" cy="106.5" r="2.4" fill="#fff" />
					<circle cx="129.5" cy="106.5" r="2.4" fill="#fff" />
				</g>
			</g>
			{/* Smile */}
			<path d="M100 124 q10 8 20 0" stroke="#ffd54a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
			{/* Cheeks */}
			<circle cx="76" cy="126" r="9" fill="url(#printy-cheek)" />
			<circle cx="144" cy="126" r="9" fill="url(#printy-cheek)" />

			{/* Output slot */}
			<rect x="64" y="146" width="92" height="8" rx="4" fill="#1a1a1a" />

			{/* The page it prints: slides out, then starts again */}
			<g className="printy-print">
				<rect x="72" y="150" width="76" height="40" rx="4" fill="url(#printy-paper)" stroke="#d7dbe0" />
				<rect x="80" y="158" width="24" height="16" rx="3" fill="#fbbf24" />
				<rect x="110" y="159" width="30" height="3.5" rx="1.75" fill="#cfd4da" />
				<rect x="110" y="166" width="22" height="3.5" rx="1.75" fill="#cfd4da" />
				<rect x="80" y="179" width="60" height="3" rx="1.5" fill="#e3e6ea" />
			</g>

			{/* Status light */}
			<circle className="printy-led" cx="160" cy="68" r="3.5" fill="#34d399" />
		</g>

		{/* Sparkles */}
		<g className="printy-sparkle" style={{ animationDelay: "0s" }}>
			<path d="M28 58 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" fill="#fde68a" />
		</g>
		<g className="printy-sparkle" style={{ animationDelay: "1.1s" }}>
			<path d="M190 30 l2.2 6 l6 2.2 l-6 2.2 l-2.2 6 l-2.2 -6 l-6 -2.2 l6 -2.2z" fill="#fbbf24" />
		</g>
		<g className="printy-sparkle" style={{ animationDelay: "2s" }}>
			<path d="M196 150 l1.8 4.6 l4.6 1.8 l-4.6 1.8 l-1.8 4.6 l-1.8 -4.6 l-4.6 -1.8 l4.6 -1.8z" fill="#fde68a" />
		</g>
	</svg>
);
