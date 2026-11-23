import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	MapPin,
	Heart,
	Eye,
	MagnifyingGlass,
	FunnelSimple,
	X,
	ImageBroken,
	SpinnerGap,
} from "@phosphor-icons/react";
import { artworkApi } from "../services/artworkApi";
import type { ArtworkWithBranch } from "../types/artwork";

const ALL_TAGS_FALLBACK = [
	"Banner",
	"Business Cards",
	"Mural",
	"T-Shirt",
	"Canvas",
	"Signage",
	"Packaging",
	"Stickers",
];

export const ArtWorks = () => {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

	const { data, isLoading } = useQuery({
		queryKey: ["artworks"],
		queryFn: () => artworkApi.getAll({ limit: 100 }),
	});

	const artworks = data?.data || [];

	// Derive unique tags from all artworks
	const allTags =
		artworks.length > 0
			? [...new Set(artworks.flatMap((a) => a.tags))]
			: ALL_TAGS_FALLBACK;

	const toggleLike = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setLikedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const filtered = artworks.filter((art) => {
		const q = searchQuery.toLowerCase();
		const matchesSearch =
			!searchQuery ||
			art.title.toLowerCase().includes(q) ||
			(art.description && art.description.toLowerCase().includes(q)) ||
			art.branchName.toLowerCase().includes(q) ||
			art.tags.some((t) => t.toLowerCase().includes(q));
		const matchesTag = !selectedTag || art.tags.includes(selectedTag);
		return matchesSearch && matchesTag;
	});

	const clearFilters = () => {
		setSelectedTag(null);
		setSearchQuery("");
	};

	const hasActiveFilters = selectedTag || searchQuery;

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl sm:text-2xl font-bold text-ink">
					Art Works
				</h2>
				<p className="text-xs sm:text-sm text-ink-2 mt-1">
					Explore stunning print work from our branches across the country
				</p>
			</div>

			{/* Search & Filter Bar */}
			<div className="flex items-center gap-2 sm:gap-3">
				<div className="flex-1 relative">
					<MagnifyingGlass
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
					/>
					<input
						type="text"
						placeholder="Search artworks..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink transition-all"
					/>
				</div>
				<button
					onClick={() => setShowFilters(!showFilters)}
					className={`p-2 sm:p-2.5 rounded-xl border transition-all shrink-0 ${
						showFilters || hasActiveFilters
							? "bg-brand border-brand text-black"
							: "bg-surface border-line text-ink-2 hover:border-brand"
					}`}
				>
					<FunnelSimple size={18} weight="bold" />
				</button>
			</div>

			{/* Filter Panel */}
			{showFilters && (
				<div className="bg-surface border border-line rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
					<div>
						<p className="text-xs font-bold text-ink-2 mb-2">
							Category
						</p>
						<div className="flex flex-wrap gap-1.5 sm:gap-2">
							{allTags.map((tag) => (
								<button
									key={tag}
									onClick={() =>
										setSelectedTag(selectedTag === tag ? null : tag)
									}
									className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
										selectedTag === tag
											? "bg-brand text-black"
											: "bg-fill text-ink-2 hover:bg-fill-press"
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>

					{hasActiveFilters && (
						<button
							onClick={clearFilters}
							className="flex items-center gap-1.5 text-xs font-bold text-bad hover:text-bad transition-colors"
						>
							<X size={14} weight="bold" />
							Clear all filters
						</button>
					)}
				</div>
			)}

			{/* Results count */}
			{!isLoading && (
				<p className="text-xs font-semibold text-ink-3">
					{filtered.length} artwork{filtered.length !== 1 && "s"} found
				</p>
			)}

			{/* Loading */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<SpinnerGap size={32} className="text-brand-ink animate-spin" />
				</div>
			) : filtered.length > 0 ? (
				<div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
					{filtered.map((art) => (
						<div key={art.id} className="mb-3 sm:mb-4 break-inside-avoid">
							<ArtWorkCard
								art={art}
								isLiked={likedIds.has(art.id)}
								onToggleLike={(e) => toggleLike(art.id, e)}
								onClick={() => navigate(`/home/artworks/${art.id}`)}
							/>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
					<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-fill flex items-center justify-center mb-4">
						<Eye size={24} weight="regular" className="text-ink-3" />
					</div>
					<p className="text-sm font-bold text-ink-2">
						No artworks found
					</p>
					<p className="text-xs text-ink-3 mt-1">
						Try adjusting your search or filters
					</p>
				</div>
			)}
		</div>
	);
};

const ArtWorkCard = ({
	art,
	isLiked,
	onToggleLike,
	onClick,
}: {
	art: ArtworkWithBranch;
	isLiked: boolean;
	onToggleLike: (e: React.MouseEvent) => void;
	onClick: () => void;
}) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const hasMultiple = art.images.length > 1;
	const thumbnail = art.images[0];

	return (
		<div className="group cursor-pointer" onClick={onClick}>
			<div className="bg-surface rounded-xl overflow-hidden border border-line hover:border-brand/50 dark:hover:border-brand/30 transition-all duration-300">
				{/* Image */}
				<div className="relative overflow-hidden">
					{thumbnail ? (
						<>
							{!imageLoaded && (
								<div className="w-full aspect-[3/4] bg-fill animate-pulse" />
							)}
							<img
								src={thumbnail}
								alt={art.title}
								onLoad={() => setImageLoaded(true)}
								className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
									imageLoaded ? "block" : "hidden"
								}`}
							/>
						</>
					) : (
						<div className="w-full aspect-[3/4] bg-fill flex items-center justify-center">
							<ImageBroken size={32} className="text-ink-3" />
						</div>
					)}

					{/* Gradient overlay */}
					<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

					{/* Multi-image badge */}
					{hasMultiple && (
						<div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/50 rounded-md sm:rounded-lg">
							<span className="text-xs font-bold text-white">
								1/{art.images.length}
							</span>
						</div>
					)}

					{/* Like button */}
					<button
						onClick={onToggleLike}
						className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full  transition-all duration-200 ${
							isLiked
								? "bg-bad text-white  "
								: "bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-bad"
						}`}
					>
						<Heart size={14} weight={isLiked ? "fill" : "regular"} />
					</button>
				</div>

				{/* Content */}
				<div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
					<h3 className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-1">
						{art.title}
					</h3>
					{art.description && (
						<p className="text-xs text-ink-2 leading-relaxed line-clamp-2">
							{art.description}
						</p>
					)}

					{/* Tags */}
					{art.tags.length > 0 && (
						<div className="hidden sm:flex flex-wrap gap-1.5">
							{art.tags.slice(0, 2).map((tag) => (
								<span
									key={tag}
									className="px-2 py-0.5 bg-fill text-xs font-semibold text-ink-2 rounded-md"
								>
									{tag}
								</span>
							))}
							{art.tags.length > 2 && (
								<span className="px-2 py-0.5 bg-fill text-xs font-semibold text-ink-3 rounded-md">
									+{art.tags.length - 2}
								</span>
							)}
						</div>
					)}

					{/* Branch tag */}
					<div className="flex items-center gap-1.5 pt-1.5 border-t border-line">
						<div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0">
							<MapPin size={8} weight="fill" className="text-black" />
						</div>
						<span className="text-xs font-semibold text-ink-2 truncate">
							{art.branchName}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
