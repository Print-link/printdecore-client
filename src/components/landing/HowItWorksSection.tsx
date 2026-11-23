import { MapPin, FileText, UploadSimple, Package, ArrowRight } from "@phosphor-icons/react";

const steps = [
	{
		number: "01",
		icon: MapPin,
		title: "Find a Print Station",
		description: "Search for print stations near you using your location. We'll show you the closest options with real-time availability.",
	},
	{
		number: "02",
		icon: FileText,
		title: "Choose Your Service",
		description: "Browse through categories and select the print service you need. From business cards to large format printing.",
	},
	{
		number: "03",
		icon: UploadSimple,
		title: "Upload & Configure",
		description: "Upload your design files and configure size, quantity, paper type, and finishing options. Get instant pricing.",
	},
	{
		number: "04",
		icon: Package,
		title: "Order & Track",
		description: "Pay securely and track your order status in real-time. Get notified at every stage of production.",
	},
];

export const HowItWorksSection = () => {
	return (
		<section id="how-it-works" className="py-20 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						How It Works
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Get your print jobs done in four simple steps. Fast, easy, and reliable.
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{steps.map((item, index) => {
						const Icon = item.icon;
						return (
							<div key={index} className="relative">
								{/* Connection Line */}
								{index < steps.length - 1 && (
									<div className="hidden lg:block absolute top-12 left-full w-full h-0.5 z-0">
										<ArrowRight size={16} weight="bold" className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-ink" />
									</div>
								)}
								<div className="relative rounded-2xl p-8 border-2 border-gray-100 hover:border-brand transition-all">
									{/* Step Number */}
									<div className="absolute -top-4 -left-4 w-12 h-12 bg-brand rounded-full flex items-center justify-center text-white font-bold text-lg">
										{item.number}
									</div>
									{/* Icon */}
									<div className="text-brand-ink mb-4 mt-4 flex justify-center">
										<Icon size={40} weight="regular" />
									</div>
									{/* Content */}
									<h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
										{item.title}
									</h3>
									<p className="text-gray-600 text-center leading-relaxed">
										{item.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

