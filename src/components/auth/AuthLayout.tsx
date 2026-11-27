import type { ReactNode } from "react";
import { Logo } from "../Logo";

/**
 * Sign-in, sign-up and code screens share this frame. Illustrations are from
 * unDraw (free for commercial use, no attribution), recoloured to our amber,
 * with a dark variant each in /public/illustrations. They are decoration:
 * the band sits under the form, so the home indicator may overlap its base.
 */
export type AuthArt = "print" | "mailbox" | "code-sent" | "delivered";

const Art = ({ name, className = "" }: { name: string; className?: string }) => (
	<>
		<img src={`/illustrations/${name}.svg`} alt="" className={`dark:hidden ${className}`} draggable={false} />
		<img src={`/illustrations/${name}-dark.svg`} alt="" className={`hidden dark:block ${className}`} draggable={false} />
	</>
);

const POOL = ["mailbox", "documents", "print", "delivered", "code-sent"];

/**
 * Where each picture stands in the band along the bottom, left to right. The
 * screen's own picture takes the middle; the outer two only show from tablets
 * up, and lean off the edges like the pile at the foot of a page.
 */
/** The screen's picture in the middle, the rest around it */
const band = (art: AuthArt) => {
	const rest = POOL.filter((n) => n !== art);
	return [rest[0], rest[1], art, rest[2], rest[3]];
};

const SLOTS = [
	"hidden md:block left-[-3%] h-[72%]",
	"left-[-13%] md:left-[15%] h-[66%] md:h-[84%]",
	"left-1/2 -translate-x-1/2 h-[86%] md:h-full z-10",
	"right-[-13%] md:right-[15%] h-[66%] md:h-[84%]",
	"hidden md:block right-[-3%] h-[72%]",
];

export const AuthLayout = ({
	art,
	title,
	subtitle,
	children,
}: {
	art: AuthArt;
	title: ReactNode;
	subtitle?: ReactNode;
	children: ReactNode;
}) => (
	<div className="min-h-dvh bg-page flex flex-col pt-safe overflow-x-hidden">
		<header className="h-16 px-5 flex items-center justify-center md:h-20">
			<Logo size="md" />
		</header>

		<main className="w-full max-w-sm mx-auto px-5 pt-4 pb-10 md:pt-6">
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-bold title-tight text-ink">{title}</h1>
				{subtitle && <div className="mt-1 text-ink-2">{subtitle}</div>}
			</div>

			{children}
		</main>

		{/* The pictures, spread along the foot of the page */}
		<footer className="mt-auto relative h-40 md:h-56 lg:h-64 overflow-hidden" aria-hidden>
			<div className="absolute inset-x-0 bottom-0 h-5 md:h-7 bg-brand-tint" />
			{band(art).map((name, i) => (
				<div key={name} className={`auth-rise absolute bottom-2 md:bottom-3 ${SLOTS[i]}`} style={{ animationDelay: `${Math.abs(i - 2) * 90}ms` }}>
					<Art name={name} className="h-full w-auto max-w-none" />
				</div>
			))}
		</footer>
	</div>
);
