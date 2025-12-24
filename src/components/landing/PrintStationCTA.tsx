import { ArrowRight, Check, Printer } from "lucide-react";

const benefits = [
	"Get discovered by local customers",
	"Manage orders from one dashboard",
	"Set your own pricing",
	"Track order status and fulfillment",
];

interface PrintStationCTAProps {
	onJoinClick: () => void;
}

export const PrintStationCTA = ({ onJoinClick }: PrintStationCTAProps) => {
	return (
		<section className="py-16 bg-white dark:bg-[var(--bg-primary)]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-gradient-to-br from-gray-50 to-white dark:from-[var(--bg-secondary)] dark:to-[var(--bg-primary)] rounded-2xl p-8 md:p-12 border-2 border-gray-200 dark:border-[var(--border-color)]">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
						<div>
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[var(--text-primary)] mb-4">
								Are you a print station owner?
							</h2>
							<p className="text-lg text-gray-600 dark:text-[var(--text-secondary)] mb-6">
								Join our platform to reach more customers, manage orders
								efficiently, and grow your print business.
							</p>
							<ul className="space-y-3 mb-6">
								{benefits.map((benefit, index) => (
									<li key={index} className="flex items-center gap-3">
										<Check className="w-5 h-5 text-[#fbbf24]" />
										<span className="text-gray-700 dark:text-[var(--text-secondary)]">{benefit}</span>
									</li>
								))}
							</ul>
							<button
								onClick={onJoinClick}
								className="inline-flex items-center gap-2 bg-[#fbbf24] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#fcd34d] transition-all"
							>
								Join as Print Station
								<ArrowRight className="w-5 h-5" />
							</button>
						</div>
						<div className="hidden md:block">
							<div className="bg-[#fbbf24]/10 dark:bg-[#fbbf24]/20 rounded-xl p-8">
								<Printer className="w-32 h-32 text-[#fbbf24] mx-auto" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

