import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServiceCardProps {
	service: {
		name: string;
		images: string[];
		examples: string;
	};
	serviceIndex: number;
}

export const ServiceCard = ({ service, serviceIndex }: ServiceCardProps) => {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Auto-scroll functionality
	useEffect(() => {
		if (isPaused || service.images.length <= 1) return;

		// Stagger start times for each card
		const startDelay = setTimeout(() => {
			intervalRef.current = setInterval(() => {
				setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
			}, 3000); // Change image every 3 seconds
		}, 1000 + serviceIndex * 200);

		return () => {
			clearTimeout(startDelay);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isPaused, service.images.length, serviceIndex]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (resumeTimeoutRef.current) {
				clearTimeout(resumeTimeoutRef.current);
			}
		};
	}, []);

	const pauseAndResume = () => {
		setIsPaused(true);

		// Clear any existing resume timeout
		if (resumeTimeoutRef.current) {
			clearTimeout(resumeTimeoutRef.current);
		}

		// Resume auto-scroll after 5 seconds of manual interaction
		resumeTimeoutRef.current = setTimeout(() => {
			setIsPaused(false);
		}, 5000);
	};

	const handlePrevious = () => {
		setCurrentImageIndex((prev) =>
			prev === 0 ? service.images.length - 1 : prev - 1
		);
		pauseAndResume();
	};

	const handleNext = () => {
		setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
		pauseAndResume();
	};

	const handleImageClick = (index: number) => {
		setCurrentImageIndex(index);
		pauseAndResume();
	};

	return (
		<div
			className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#fbbf24] transition-all cursor-pointer group"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			<div className="relative h-48 overflow-hidden">
				{service.images.map((image, index) => (
					<img
						key={index}
						src={image}
						alt={`${service.name} - Image ${index + 1}`}
						loading="lazy"
						className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
							index === currentImageIndex
								? "opacity-100 scale-110"
								: "opacity-0 scale-100"
						}`}
					/>
				))}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

				{/* Navigation Buttons */}
				{service.images.length > 1 && (
					<>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handlePrevious();
							}}
							className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
							aria-label="Previous image"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleNext();
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
							aria-label="Next image"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</>
				)}

				{/* Image Indicators */}
				{service.images.length > 1 && (
					<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
						{service.images.map((_, index) => (
							<button
								key={index}
								onClick={(e) => {
									e.stopPropagation();
									handleImageClick(index);
								}}
								className={`h-1.5 rounded-full transition-all ${
									index === currentImageIndex
										? "bg-white w-6"
										: "bg-white/50 w-1.5 hover:bg-white/75"
								}`}
								aria-label={`Go to image ${index + 1}`}
							/>
						))}
					</div>
				)}
			</div>
			<div className="p-4">
				<h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#fbbf24] transition-colors">
					{service.name}
				</h3>
				<p className="text-sm text-gray-600">{service.examples}</p>
			</div>
		</div>
	);
};

