import { MapPin, Calculator, Upload, Clock, Shield, Zap } from "lucide-react";

const features = [
	{
		icon: <MapPin className="w-8 h-8" />,
		title: "Location-Based",
		description:
			"Find print stations near you. Get your orders faster with local pickup or delivery.",
	},
	{
		icon: <Calculator className="w-8 h-8" />,
		title: "Instant Pricing",
		description:
			"Get real-time price calculations based on your specifications. No surprises.",
	},
	{
		icon: <Upload className="w-8 h-8" />,
		title: "Easy File Upload",
		description:
			"Upload multiple design files. Support for images, PDFs, and more.",
	},
	{
		icon: <Clock className="w-8 h-8" />,
		title: "Order Tracking",
		description:
			"Track your order status from pending to completion in real-time.",
	},
	{
		icon: <Shield className="w-8 h-8" />,
		title: "Secure Payments",
		description:
			"Pay securely with Paystack. Your payment is protected and verified.",
	},
	{
		icon: <Zap className="w-8 h-8" />,
		title: "Fast Turnaround",
		description:
			"Connect directly with local print shops for quick order fulfillment.",
	},
];

export const KeyFeaturesSection = () => {
	return (
		<section className="py-16 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
					Why choose our platform
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div
							key={index}
							className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-[#fbbf24] transition-all"
						>
							<div className="text-[#fbbf24] mb-4">{feature.icon}</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								{feature.title}
							</h3>
							<p className="text-gray-600">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

