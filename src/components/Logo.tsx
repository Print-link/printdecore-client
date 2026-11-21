interface LogoProps {
	className?: string;
	size?: "sm" | "md" | "lg" | "xl" | "2xl";
	onClick?: () => void;
}

/**
 * The Printdecore logo: the printer icon and the wordmark as real text, so it
 * stays sharp at any size and "print" turns white in dark mode. (The old
 * image had wide empty margins and black lettering that vanished on dark.)
 */
const SIZES = {
	sm: { icon: "w-6 h-6", text: "text-base" },
	md: { icon: "w-7 h-7", text: "text-xl" },
	lg: { icon: "w-9 h-9", text: "text-2xl" },
	xl: { icon: "w-9 h-9", text: "text-[26px]" },
	"2xl": { icon: "w-11 h-11", text: "text-3xl" },
};

export const Logo = ({ className = "", size = "md", onClick }: LogoProps) => {
	const s = SIZES[size];
	return (
		<span
			role={onClick ? "link" : "img"}
			aria-label="Printdecore"
			onClick={onClick}
			className={`inline-flex items-center gap-1.5 select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
		>
			<img src="/logoIcon-192.png" alt="" className={`${s.icon} rounded-lg bg-white p-0.5 ring-1 ring-black/5 dark:ring-white/10`} />
			<span className={`${s.text} font-black italic tracking-tight leading-none`}>
				<span className="text-gray-900 dark:text-white">print</span>
				<span className="text-[#fbbf24]">decore</span>
			</span>
		</span>
	);
};
