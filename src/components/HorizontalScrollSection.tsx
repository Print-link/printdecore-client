import React from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { SectionHeader } from "./ui";

interface HorizontalScrollSectionProps {
	title: string;
	subtitle?: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	showAllLink?: string;
}

/** A bold section title over a row that scrolls sideways, edge to edge on phones */
export const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({ title, subtitle, children, showAllLink }) => {
	const navigate = useNavigate();
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const scroll = (direction: "left" | "right") => scrollRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });

	return (
		<section className="mb-7">
			<SectionHeader title={title} sub={subtitle} action={showAllLink ? "See all" : undefined} onAction={() => showAllLink && navigate(showAllLink)} />
			<div className="relative group">
				<button
					onClick={() => scroll("left")}
					aria-label="Scroll left"
					className="hidden md:flex absolute left-0 top-12 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line items-center justify-center text-ink opacity-0 group-hover:opacity-100"
				>
					<CaretLeft size={16} weight="bold" />
				</button>
				<div ref={scrollRef} className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto hide-scrollbar snap-x scroll-px-4">
					{children}
				</div>
				<button
					onClick={() => scroll("right")}
					aria-label="Scroll right"
					className="hidden md:flex absolute right-0 top-12 translate-x-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line items-center justify-center text-ink opacity-0 group-hover:opacity-100"
				>
					<CaretRight size={16} weight="bold" />
				</button>
			</div>
		</section>
	);
};
