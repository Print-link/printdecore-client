import { MapPin, FileText, Upload, Package } from "lucide-react";

const steps = [
	{
		icon: <MapPin className="w-8 h-8" />,
		title: "Find a Station",
		description: "Search for print stations near you using your location",
	},
	{
		icon: <FileText className="w-8 h-8" />,
		title: "Choose Service",
		description: "Browse categories and select the print service you need",
	},
	{
		icon: <Upload className="w-8 h-8" />,
		title: "Upload & Configure",
		description:
			"Upload your design files and configure size, quantity, and options",
	},
	{
		icon: <Package className="w-8 h-8" />,
		title: "Order & Track",
		description: "Pay securely and track your order status in real-time",
	},
];

export const HowItWorksSection = () => {
	return (
		<section className="py-16 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
					How it works
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{steps.map((item, index) => (
						<div key={index} className="text-center">
							<div className="text-[#fbbf24] mb-3 flex justify-center">
								{item.icon}
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								{item.title}
							</h3>
							<p className="text-gray-600">{item.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

