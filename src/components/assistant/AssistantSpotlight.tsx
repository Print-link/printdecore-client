import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { PrintyAvatar } from "./PrintyAvatar";

/** One-tap starts: open the assistant with the idea filled in */
const IDEAS = [
	{ label: "Business cards", text: "I need business cards — " },
	{ label: "A banner", text: "I need a banner for " },
	{ label: "Print my document", text: "Please print my document: " },
];

/**
 * The Print Assistant on Home: one flat ink block — Printy, a plain line on
 * what it does, and quick starts. No glow, no tilt.
 */
export const AssistantSpotlight = () => {
	const navigate = useNavigate();
	const open = (idea?: string) => navigate("/home/print-assistant", idea ? { state: { prefill: idea } } : undefined);

	return (
		<section className="mb-7 rounded-xl bg-gray-900 dark:bg-night-2 dark:ring-1 dark:ring-inset dark:ring-line text-white overflow-hidden" aria-label="Print Assistant">
			<button type="button" onClick={() => open()} className="tap w-full flex items-center gap-3 p-4 text-left">
				<span className="w-12 h-12 shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
					<PrintyAvatar size={36} />
				</span>
				<span className="flex-1 min-w-0">
					<span className="block text-lg font-bold title-tight">Ask the Print Assistant</span>
					<span className="block text-sm text-white/65">Say what you need. Printy prices it and finds a printer.</span>
				</span>
				<span className="w-10 h-10 shrink-0 rounded-xl bg-brand text-black flex items-center justify-center">
					<ArrowRight size={18} weight="bold" />
				</span>
			</button>
			<div className="flex gap-2 px-4 pb-4 overflow-x-auto hide-scrollbar">
				{IDEAS.map((idea) => (
					<button
						key={idea.label}
						type="button"
						onClick={() => open(idea.text)}
						className="tap shrink-0 h-8 px-3 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/15"
					>
						{idea.label}
					</button>
				))}
			</div>
		</section>
	);
};
