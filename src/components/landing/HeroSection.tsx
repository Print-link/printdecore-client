import { Check, Star, MapPin } from "lucide-react";

interface HeroSectionProps {
	onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
	return (
		<section className="relative bg-gradient-to-br from-[#fbbf24] via-[#fcd34d] to-[#fef3c7] dark:from-[#d97706] dark:via-[#f59e0b] dark:to-[#fbbf24] py-20 md:py-32 overflow-hidden">
			<div className="absolute inset-0 opacity-10 dark:opacity-20">
				<div className="absolute top-20 left-20 w-72 h-72 bg-black rounded-full blur-3xl"></div>
				<div className="absolute bottom-20 right-20 w-96 h-96 bg-black rounded-full blur-3xl"></div>
			</div>
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white mb-6 leading-tight">
						Connect with local print stations
						<br />
						<span className="text-gray-800 dark:text-gray-100">across Africa</span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-800 dark:text-gray-100 mb-8 max-w-3xl mx-auto">
						Order custom print jobs from nearby print shops. Upload your
						designs, get instant quotes, and track your orders in real-time.
					</p>
					<div className="flex flex-wrap justify-center gap-4 mb-8">
						<div className="flex items-center gap-2 bg-white/90 dark:bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
							<Check className="w-5 h-5 text-[#fbbf24]" />
							<span className="font-semibold text-gray-900 dark:text-white">
								Find nearby stations
							</span>
						</div>
						<div className="flex items-center gap-2 bg-white/90 dark:bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
							<Check className="w-5 h-5 text-[#fbbf24]" />
							<span className="font-semibold text-gray-900 dark:text-white">
								Instant pricing
							</span>
						</div>
						<div className="flex items-center gap-2 bg-white/90 dark:bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
							<Check className="w-5 h-5 text-[#fbbf24]" />
							<span className="font-semibold text-gray-900 dark:text-white">
								Track orders
							</span>
						</div>
					</div>
					<button
						onClick={onGetStarted}
						className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 dark:hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl mb-4"
					>
						Find Print Stations Near Me
						<MapPin className="w-5 h-5" />
					</button>
					<p className="text-gray-700 dark:text-gray-200 text-sm">
						Free to use • No hidden fees
					</p>
					<div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-200">
						<span>Trusted by</span>
						<span className="font-bold text-black dark:text-white">10,000+</span>
						<span>customers</span>
						<div className="flex items-center gap-1 ml-2">
							{[...Array(5)].map((_, i) => (
								<Star
									key={i}
									className={`w-4 h-4 ${
										i < 4
											? "fill-[#fbbf24] text-[#fbbf24]"
											: "fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600"
									}`}
								/>
							))}
						</div>
						<span className="ml-2 font-semibold">4.8</span>
					</div>
				</div>
			</div>
		</section>
	);
};

