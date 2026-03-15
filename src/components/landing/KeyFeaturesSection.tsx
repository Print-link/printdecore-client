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
		<section id="features" className="py-20 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						Why Choose Printdecore
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Everything you need for seamless print ordering and management
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div
							key={index}
							className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-2 border-gray-100 hover:border-[#fbbf24] transition-all hover:shadow-xl group"
						>
							<div className="text-[#fbbf24] mb-6 group-hover:scale-110 transition-transform">
								{feature.icon}
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">
								{feature.title}
							</h3>
							<p className="text-gray-600 leading-relaxed">{feature.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

