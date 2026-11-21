import { useId } from "react";

/**
 * Printy's face on its own, for small places: the chat avatar, the shop card.
 * `busy` makes the eyes scan and the light blink while it's working.
 */
export const PrintyAvatar = ({ size = 32, busy = false, className = "" }: { size?: number; busy?: boolean; className?: string }) => {
	// Several avatars share a page: each needs its own gradient ids
	const id = useId().replace(/:/g, "");
	return (
		<svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
			<defs>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ffe27a" />
					<stop offset="0.6" stopColor="#fbbf24" />
					<stop offset="1" stopColor="#d98a06" />
				</linearGradient>
				<radialGradient id={`${id}s`} cx="0.4" cy="0.3" r="0.9">
					<stop offset="0" stopColor="#2b2b2b" />
					<stop offset="1" stopColor="#0b0b0b" />
				</radialGradient>
			</defs>
			{/* Paper in the top */}
			<rect x="20" y="4" width="24" height="12" rx="2" fill="#fff" stroke="#d7dbe0" strokeWidth="1" />
			<rect x="24" y="8" width="10" height="2" rx="1" fill="#fbbf24" />
			{/* Lid and body */}
			<rect x="10" y="12" width="44" height="9" rx="4.5" fill="#262626" />
			<rect x="6" y="17" width="52" height="40" rx="13" fill={`url(#${id}b)`} />
			<path d="M13 25 q2 -4 8 -5 h20" stroke="#fff6cc" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
			{/* Face */}
			<rect x="14" y="25" width="36" height="22" rx="8" fill={`url(#${id}s)`} />
			<g className={busy ? "printy-scan" : "printy-look-sm"}>
				<g className="printy-blink-sm">
					<ellipse cx="25" cy="35" rx="3" ry="3.8" fill="#ffd54a" />
					<ellipse cx="39" cy="35" rx="3" ry="3.8" fill="#ffd54a" />
					<circle cx="26" cy="33.5" r="1" fill="#fff" />
					<circle cx="40" cy="33.5" r="1" fill="#fff" />
				</g>
			</g>
			<path d="M28 41.5 q4 3 8 0" stroke="#ffd54a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
			<circle cx="49" cy="16.5" r="1.8" fill="#34d399" className={busy ? "printy-led-fast" : "printy-led"} />
		</svg>
	);
};
