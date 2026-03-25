import { Compass } from "@phosphor-icons/react";

interface FinalCTASectionProps {
	onGetStarted: () => void;
}

export const FinalCTASection = ({ onGetStarted }: FinalCTASectionProps) => {
	return (
		<section className="py-20 bg-black text-white">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 className="text-4xl md:text-5xl font-bold mb-6">
					Ready to order your print job?
				</h2>
				<p className="text-xl text-gray-300 mb-8">
					Find a print station near you and get started in minutes
				</p>
				<button
					onClick={onGetStarted}
					className="inline-flex items-center gap-2 bg-[#fbbf24] text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#fcd34d] transition-all transform hover:scale-105 shadow-xl"
				>
					Find Print Stations
					<Compass size={20} weight="bold" />
				</button>
			</div>
		</section>
	);
};

