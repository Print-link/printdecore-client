import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { PrintyMascot } from "./PrintyMascot";

/** What Printy says in its speech bubble, in turn */
const LINES = ["Business cards? Easy.", "I'll price it for you.", "Banners, flyers, mugs…", "Send me your file!"];

/** One-tap starts: open the assistant with the idea filled in */
const IDEAS = [
	{ label: "Business cards", text: "I need business cards — " },
	{ label: "A banner", text: "I need a banner for " },
	{ label: "Print my document", text: "Please print my document: " },
];

/**
 * The Print Assistant's spotlight card on Home: a dark, glowing card with
 * Printy waving, a speech bubble that cycles ideas, and quick starts. On a
 * computer it tilts toward the mouse for a 3D feel.
 */
export const AssistantSpotlight = () => {
	const navigate = useNavigate();
	const card = useRef<HTMLDivElement>(null);
	const [line, setLine] = useState(0);
	const [tilt, setTilt] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const id = window.setInterval(() => setLine((n) => (n + 1) % LINES.length), 2800);
		return () => window.clearInterval(id);
	}, []);

	const open = (idea?: string) => navigate("/home/print-assistant", idea ? { state: { prefill: idea } } : undefined);

	const onMove = (e: React.PointerEvent) => {
		if (e.pointerType !== "mouse" || !card.current) return;
		const r = card.current.getBoundingClientRect();
		setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -6, y: ((e.clientX - r.left) / r.width - 0.5) * 8 });
	};

	return (
		<div className="[perspective:1000px] mb-3">
			<div
				ref={card}
				role="button"
				tabIndex={0}
				onClick={() => open()}
				onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
				onPointerMove={onMove}
				onPointerLeave={() => setTilt({ x: 0, y: 0 })}
				style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
				className="tap relative overflow-hidden rounded-3xl cursor-pointer select-none transition-transform duration-200 ease-out
					bg-[radial-gradient(120%_140%_at_100%_0%,#5a3b00_0%,#1b1408_45%,#0d0d0d_100%)]
					ring-1 ring-amber-400/25 shadow-[0_20px_50px_-20px_rgba(251,191,36,0.55)]"
				aria-label="Open the Print Assistant"
			>
				{/* Moving glow */}
				<span className="printy-glow pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-amber-400/25 blur-3xl" />
				{/* Faint dot grid */}
				<span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

				<div className="relative">
					<div className="flex items-start">
						<div className="flex-1 min-w-0 p-5 sm:p-6 pr-1 sm:pr-2">
							<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
								<Sparkle size={12} weight="fill" className="printy-twinkle" /> AI · Print Assistant
							</span>
							<h2 className="mt-3 text-[22px] sm:text-[28px] font-black leading-[1.1] text-white">
								Meet Printy.
								<br />
								<span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">Just say what you need.</span>
							</h2>
						</div>

						<div className="relative w-[136px] sm:w-[210px] shrink-0 pt-12 sm:pt-10 pr-2 sm:pr-4">
							{/* Speech bubble */}
							<div
								key={line}
								className="printy-bubble absolute top-4 right-3 sm:right-5 max-w-[124px] sm:max-w-[160px] rounded-2xl rounded-br-md bg-white px-2.5 py-1.5 text-[11px] sm:text-xs font-bold leading-tight text-gray-900 shadow-lg"
								aria-live="polite"
							>
								{LINES[line]}
							</div>
							<PrintyMascot className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]" />
						</div>
					</div>

					<div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
						<span className="order-2 sm:order-1 inline-flex justify-center sm:w-fit items-center gap-2 rounded-2xl bg-[#fbbf24] px-5 py-3 text-sm font-black text-black shadow-lg shadow-amber-500/30">
							Start chatting <ArrowRight size={16} weight="bold" className="printy-nudge" />
						</span>
						<div className="order-1 sm:order-2 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto hide-scrollbar">
							{IDEAS.map((idea) => (
								<button
									key={idea.label}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										open(idea.text);
									}}
									className="tap shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-100 backdrop-blur-sm hover:bg-white/10"
								>
									{idea.label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
