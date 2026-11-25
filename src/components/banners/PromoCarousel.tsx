import { useNavigate } from "react-router-dom";
import { usePromoBanners } from "../../hooks/usePromoBanners";
import type { PromoBanner } from "../../services/promoBannerApi";

const isAppPath = (link: string) => link.startsWith("/") && !link.startsWith("//");

/** One wide card: coloured panel with the headline and subline, the image on the right */
const PromoCard = ({ banner, onOpen, only }: { banner: PromoBanner; onOpen: () => void; only: boolean }) => (
	<button
		type="button"
		onClick={onOpen}
		aria-label={[banner.headline, banner.subline].filter(Boolean).join(". ")}
		className={`tap snap-start shrink-0 relative overflow-hidden ${only ? "w-full" : "w-[88vw]"} max-w-[520px] aspect-[2.15/1] rounded-2xl text-left`}
		style={{ backgroundColor: banner.backgroundColor }}
	>
		{banner.imageUrl && (
			<img
				src={banner.imageUrl}
				alt=""
				loading="lazy"
				className="absolute inset-y-0 right-0 h-full w-[46%] object-cover"
				// A rounded left edge, so the photo sits in the panel rather than beside it
				style={{ clipPath: "ellipse(100% 100% at 100% 50%)" }}
			/>
		)}
		<span className={`relative flex h-full flex-col justify-center px-5 ${banner.imageUrl ? "w-[58%]" : "w-full"}`}>
			<span className="block text-[22px] leading-[1.15] font-bold title-tight text-white line-clamp-3">{banner.headline}</span>
			{banner.subline && <span className="block mt-2 text-sm leading-snug font-medium text-white/70 line-clamp-2">{banner.subline}</span>}
		</span>
	</button>
);

/**
 * Promo banners from the admin dashboard, in their own sideways row on Home.
 * Nothing shows when there are none live. App paths open in the app; other
 * links open in a new tab.
 */
export const PromoCarousel = () => {
	const navigate = useNavigate();
	const { data: banners = [] } = usePromoBanners();
	if (banners.length === 0) return null;

	const open = (link: string) => {
		if (isAppPath(link)) navigate(link);
		else window.open(link, "_blank", "noopener,noreferrer");
	};

	return (
		<section className="mb-7" aria-label="Offers">
			<div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-px-4">
				{banners.map((b) => (
					<PromoCard key={b.id} banner={b} only={banners.length === 1} onOpen={() => open(b.linkUrl)} />
				))}
			</div>
		</section>
	);
};
