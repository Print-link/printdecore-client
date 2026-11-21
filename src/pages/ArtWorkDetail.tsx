import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Heart,
	MapPin,
	CaretLeft,
	CaretRight,
	ShareNetwork,
	CalendarBlank,
	MapTrifold,
	SpinnerGap,
	ImageBroken,
} from "@phosphor-icons/react";
import { artworkApi } from "../services/artworkApi";
import type { ArtworkWithBranch } from "../types/artwork";

export const ArtWorkDetail = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [currentImage, setCurrentImage] = useState(0);
	const [isLiked, setIsLiked] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["artwork", id],
		queryFn: () => artworkApi.getById(id!),
		enabled: !!id,
	});

	const art = data?.data;

	// Fetch related artworks from the same branch
	const { data: relatedData } = useQuery({
		queryKey: ["artworks", "related", art?.branchId],
		queryFn: () => artworkApi.getAll({ branchId: art!.branchId, limit: 5 }),
		enabled: !!art?.branchId,
	});

	const related = (relatedData?.data || [])
		.filter((a) => a.id !== id)
		.slice(0, 4);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<SpinnerGap size={32} className="text-[#fbbf24] animate-spin" />
			</div>
		);
	}

	if (!art) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<p className="text-sm font-bold text-gray-600 dark:text-gray-300">
					Artwork not found
				</p>
				<button
					onClick={() => navigate("/home/artworks")}
					className="mt-4 px-4 py-2 bg-[#fbbf24] text-black text-sm font-bold rounded-xl"
				>
					Back to Art Works
				</button>
			</div>
		);
	}

	const scrollToImage = (index: number) => {
		setCurrentImage(index);
		if (scrollRef.current) {
			const child = scrollRef.current.children[index] as HTMLElement;
			child?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	};

	const nextImage = () => {
		scrollToImage((currentImage + 1) % art.images.length);
	};

	const prevImage = () => {
		scrollToImage(
			(currentImage - 1 + art.images.length) % art.images.length
		);
	};

	return (
		<div className="space-y-6 pb-8">
			{/* Back button */}
			<button
				onClick={() => navigate("/home/artworks")}
				className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-[#fbbf24] transition-colors"
			>
				<ArrowLeft size={18} weight="bold" />
				<span className="hidden sm:inline">Back to Art Works</span>
				<span className="sm:hidden">Back</span>
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left column - Images */}
				<div className="lg:col-span-2 space-y-3">
					{/* Main image carousel */}
					<div className="relative bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
						{art.images.length > 0 ? (
							<div
								ref={scrollRef}
								className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
								onScroll={(e) => {
									const el = e.currentTarget;
									const idx = Math.round(el.scrollLeft / el.clientWidth);
									if (idx !== currentImage) setCurrentImage(idx);
								}}
							>
								{art.images.map((img, i) => (
									<img
										key={i}
										src={img}
										alt={`${art.title} - ${i + 1}`}
										className="w-full shrink-0 snap-center object-cover max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh]"
									/>
								))}
							</div>
						) : (
							<div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
								<ImageBroken size={48} className="text-gray-300" />
							</div>
						)}

						{/* Nav arrows */}
						{art.images.length > 1 && (
							<>
								<button
									onClick={prevImage}
									className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all"
								>
									<CaretLeft size={16} weight="bold" />
								</button>
								<button
									onClick={nextImage}
									className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all"
								>
									<CaretRight size={16} weight="bold" />
								</button>
							</>
						)}

						{/* Dots indicator */}
						{art.images.length > 1 && (
							<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
								{art.images.map((_, i) => (
									<button
										key={i}
										onClick={() => scrollToImage(i)}
										className={`rounded-full transition-all ${
											i === currentImage
												? "w-5 h-1.5 bg-[#fbbf24]"
												: "w-1.5 h-1.5 bg-white/60 hover:bg-white"
										}`}
									/>
								))}
							</div>
						)}
					</div>

					{/* Thumbnails strip */}
					{art.images.length > 1 && (
						<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
							{art.images.map((img, i) => (
								<button
									key={i}
									onClick={() => scrollToImage(i)}
									className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
										i === currentImage
											? "border-[#fbbf24] ring-2 ring-[#fbbf24]/30"
											: "border-transparent opacity-60 hover:opacity-100"
									}`}
								>
									<img
										src={img}
										alt={`Thumb ${i + 1}`}
										className="w-full h-full object-cover"
									/>
								</button>
							))}
						</div>
					)}

					{/* Description - shown below images on mobile */}
					<div className="lg:hidden space-y-4">
						<ContentSection
							art={art}
							isLiked={isLiked}
							onToggleLike={() => setIsLiked(!isLiked)}
						/>
						<BranchCard art={art} onViewBranch={() => navigate(`/home/print-station/${art.branchId}`)} />
					</div>
				</div>

				{/* Right column - Info sidebar (desktop) */}
				<div className="hidden lg:flex flex-col gap-4">
					<ContentSection
						art={art}
						isLiked={isLiked}
						onToggleLike={() => setIsLiked(!isLiked)}
					/>
					<BranchCard art={art} onViewBranch={() => navigate(`/home/print-station/${art.branchId}`)} />
				</div>
			</div>

			{/* Related artworks */}
			{related.length > 0 && (
				<div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
					<h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
						More like this
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
						{related.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									navigate(`/home/artworks/${item.id}`);
									window.scrollTo({ top: 0, behavior: "smooth" });
								}}
								className="text-left group"
							>
								<div className="bg-white dark:bg-[#1e1e1e] rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-[#fbbf24]/50 transition-all">
									<div className="relative overflow-hidden">
										{item.images[0] ? (
											<img
												src={item.images[0]}
												alt={item.title}
												className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										) : (
											<div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
												<ImageBroken size={24} className="text-gray-300" />
											</div>
										)}
									</div>
									<div className="p-2 sm:p-3">
										<p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
											{item.title}
										</p>
										<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
											{item.branchName}
										</p>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

const ContentSection = ({
	art,
	isLiked,
	onToggleLike,
}: {
	art: ArtworkWithBranch;
	isLiked: boolean;
	onToggleLike: () => void;
}) => (
	<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 space-y-4">
		{/* Title & actions */}
		<div className="flex items-start justify-between gap-3">
			<h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">
				{art.title}
			</h1>
			<div className="flex items-center gap-2 shrink-0">
				<button
					onClick={onToggleLike}
					className={`p-2 rounded-xl transition-all ${
						isLiked
							? "bg-red-50 dark:bg-red-900/20 text-red-500"
							: "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500"
					}`}
				>
					<Heart size={18} weight={isLiked ? "fill" : "regular"} />
				</button>
				<button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#fbbf24] transition-all">
					<ShareNetwork size={18} weight="regular" />
				</button>
			</div>
		</div>

		{/* Description */}
		{art.description && (
			<p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
				{art.description}
			</p>
		)}

		{/* Tags */}
		{art.tags.length > 0 && (
			<div className="flex flex-wrap gap-2">
				{art.tags.map((tag) => (
					<span
						key={tag}
						className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 rounded-lg"
					>
						{tag}
					</span>
				))}
			</div>
		)}

		{/* Meta */}
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
			<span className="flex items-center gap-1.5 text-xs text-gray-500">
				<CalendarBlank
					size={13}
					weight="duotone"
					className="text-gray-400"
				/>
				{new Date(art.createdAt).toLocaleDateString("en-GB", {
					day: "numeric",
					month: "short",
					year: "numeric",
				})}
			</span>
		</div>
	</div>
);

const BranchCard = ({
	art,
	onViewBranch,
}: {
	art: ArtworkWithBranch;
	onViewBranch: () => void;
}) => (
	<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 space-y-4">
		<p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
			Posted by branch
		</p>

		{/* Branch header */}
		<div className="flex items-center gap-3">
			{art.branchAvatar ? (
				<img
					src={art.branchAvatar}
					alt={art.branchName}
					className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shadow-md"
				/>
			) : (
				<div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shrink-0 shadow-md shadow-amber-200/30">
					<span className="text-sm sm:text-base font-black text-black">
						{art.branchName
							.split(" ")
							.map((w) => w[0])
							.join("")
							.slice(0, 2)}
					</span>
				</div>
			)}
			<div className="min-w-0">
				<h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
					{art.branchName}
				</h3>
			</div>
		</div>

		{/* Branch location */}
		{art.branchLocation && (
			<div className="space-y-2.5">
				<div className="flex items-start gap-2.5">
					<MapTrifold
						size={16}
						weight="duotone"
						className="text-[#fbbf24] mt-0.5 shrink-0"
					/>
					<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
						{art.branchLocation}
					</span>
				</div>
				<div className="flex items-center gap-2.5">
					<MapPin
						size={16}
						weight="duotone"
						className="text-[#fbbf24] shrink-0"
					/>
					<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
						Ghana
					</span>
				</div>
			</div>
		)}

		{/* View branch button */}
		<button
			onClick={onViewBranch}
			className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-[#fbbf24] hover:text-black text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-bold rounded-xl transition-all"
		>
			View Branch
		</button>
	</div>
);
