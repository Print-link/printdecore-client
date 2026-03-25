import { Check, ArrowRight, MapPin } from "@phosphor-icons/react";
import heroImage from "../../assets/images/HeroImage1.jpg";
import { Logo } from "../Logo";

interface HeroSectionProps {
	onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
	return (
		<section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
			{/* Background Image */}
			<div className="absolute inset-0">
				<img
					src={heroImage}
					alt="Professional print services connecting customers with local print stations across Africa"
					className="w-full h-full object-cover object-center md:object-cover"
					loading="eager"
				/>
				{/* Responsive overlay - darker on mobile for better text readability */}
				<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 md:from-black/30 md:via-black/20 md:to-black/40"></div>
			</div>

			{/* Content - Positioned to work with image text */}
			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-0">
				<div className="max-w-5xl mx-auto">
					{/* Logo - Smaller on mobile */}
					<div className="flex justify-center mb-6 md:mb-8">
						<Logo size="lg" className="md:hidden" />
						<Logo size="2xl" className="hidden md:block" />
					</div>

					{/* Main Tagline - Print • Share • Connect */}
					<div className="text-center mb-6 md:mb-8">
						<div className="flex items-center justify-center gap-2 md:gap-3 lg:gap-4 flex-wrap">
							<h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl">
								Print
							</h1>
							<span className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#fbbf24] drop-shadow-2xl">
								•
							</span>
							<h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl">
								Share
							</h1>
							<span className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#fbbf24] drop-shadow-2xl">
								•
							</span>
							<h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl">
								Connect
							</h1>
						</div>
					</div>

					{/* Subheading */}
					<p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 md:mb-8 max-w-3xl mx-auto text-center leading-relaxed drop-shadow-lg px-2">
						Order custom print jobs from nearby print shops. Upload your
						designs, get instant quotes, and track your orders in real-time.
					</p>

					{/* Key Benefits - Stack on mobile */}
					<div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mb-6 md:mb-8 px-2">
						<div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 md:px-5 md:py-3 rounded-full border border-white/30 shadow-lg text-sm md:text-base">
							<>
								<Check size={16} weight="bold" className="text-[#fbbf24] flex-shrink-0 md:hidden" />
								<Check size={20} weight="bold" className="text-[#fbbf24] flex-shrink-0 hidden md:block" />
							</>
							<span className="font-semibold text-white whitespace-nowrap">
								Find Nearby Stations
							</span>
						</div>
						<div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 md:px-5 md:py-3 rounded-full border border-white/30 shadow-lg text-sm md:text-base">
							<>
								<Check size={16} weight="bold" className="text-[#fbbf24] flex-shrink-0 md:hidden" />
								<Check size={20} weight="bold" className="text-[#fbbf24] flex-shrink-0 hidden md:block" />
							</>
							<span className="font-semibold text-white whitespace-nowrap">Instant Pricing</span>
						</div>
						<div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 md:px-5 md:py-3 rounded-full border border-white/30 shadow-lg text-sm md:text-base">
							<>
								<Check size={16} weight="bold" className="text-[#fbbf24] flex-shrink-0 md:hidden" />
								<Check size={20} weight="bold" className="text-[#fbbf24] flex-shrink-0 hidden md:block" />
							</>
							<span className="font-semibold text-white whitespace-nowrap">Real-Time Tracking</span>
						</div>
					</div>

					{/* CTA Buttons - Full width on mobile */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6 px-2">
						<button
							onClick={onGetStarted}
							className="inline-flex items-center justify-center gap-2 bg-[#fbbf24] text-black px-6 py-3 md:px-8 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-[#fcd34d] transition-all transform hover:scale-105 shadow-2xl w-full sm:w-auto"
							aria-label="Find print stations near you"
						>
							Get Started Now
							<ArrowRight size={20} weight="bold" />
						</button>
						<button
							onClick={onGetStarted}
							className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md text-white border-2 border-white/40 px-6 py-3 md:px-8 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-white/25 transition-all shadow-lg w-full sm:w-auto"
							aria-label="Find print stations using location"
						>
							<MapPin size={20} weight="bold" />
							Use My Location
						</button>
					</div>

					{/* Trust Indicator */}
					<p className="text-center text-white/90 text-xs sm:text-sm drop-shadow-md px-2">
						Free to use • No hidden fees • Secure payments
					</p>
				</div>
			</div>

			{/* Decorative Elements - Smooth transition to next section */}
			<div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-white to-transparent"></div>
		</section>
	);
};
