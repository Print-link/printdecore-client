import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Check,
	Star,
	MapPin,
	Printer,
	Upload,
	Calculator,
	Clock,
	Shield,
	Zap,
	FileText,
	Package,
	Quote,
	Navigation,
} from "lucide-react";

export const Landing = () => {
	const navigate = useNavigate();

	const handleGetStarted = () => {
		// If user is logged in, go to search/home
		// Otherwise, go to login/register
		navigate("/search");
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-[#fbbf24] via-[#fcd34d] to-[#fef3c7] py-20 md:py-32 overflow-hidden">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-20 left-20 w-72 h-72 bg-black rounded-full blur-3xl"></div>
					<div className="absolute bottom-20 right-20 w-96 h-96 bg-black rounded-full blur-3xl"></div>
				</div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
							Connect with local print stations
							<br />
							<span className="text-gray-800">across Africa</span>
						</h1>
						<p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto">
							Order custom print jobs from nearby print shops. Upload your designs, get instant quotes, and track your orders in real-time.
						</p>
						<div className="flex flex-wrap justify-center gap-4 mb-8">
							<div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
								<Check className="w-5 h-5 text-[#fbbf24]" />
								<span className="font-semibold text-gray-900">Find nearby stations</span>
							</div>
							<div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
								<Check className="w-5 h-5 text-[#fbbf24]" />
								<span className="font-semibold text-gray-900">Instant pricing</span>
							</div>
							<div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
								<Check className="w-5 h-5 text-[#fbbf24]" />
								<span className="font-semibold text-gray-900">Track orders</span>
							</div>
						</div>
						<button
							onClick={handleGetStarted}
							className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-900 transition-all transform hover:scale-105 shadow-xl mb-4"
						>
							Find Print Stations Near Me
							<MapPin className="w-5 h-5" />
						</button>
						<p className="text-gray-700 text-sm">
							Free to use • No hidden fees
						</p>
						<div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-700">
							<span>Trusted by</span>
							<span className="font-bold text-black">10,000+</span>
							<span>customers</span>
							<div className="flex items-center gap-1 ml-2">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`w-4 h-4 ${
											i < 4 ? "fill-[#fbbf24] text-[#fbbf24]" : "fill-gray-300 text-gray-300"
										}`}
									/>
								))}
							</div>
							<span className="ml-2 font-semibold">4.8</span>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
						How it works
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						{[
							{
								step: "1",
								icon: <MapPin className="w-8 h-8" />,
								title: "Find a Station",
								description: "Search for print stations near you using your location",
							},
							{
								step: "2",
								icon: <FileText className="w-8 h-8" />,
								title: "Choose Service",
								description: "Browse categories and select the print service you need",
							},
							{
								step: "3",
								icon: <Upload className="w-8 h-8" />,
								title: "Upload & Configure",
								description: "Upload your design files and configure size, quantity, and options",
							},
							{
								step: "4",
								icon: <Package className="w-8 h-8" />,
								title: "Order & Track",
								description: "Pay securely and track your order status in real-time",
							},
						].map((item, index) => (
							<div key={index} className="text-center">
								<div className="inline-flex items-center justify-center w-16 h-16 bg-[#fbbf24] rounded-full text-black font-bold text-2xl mb-4">
									{item.step}
								</div>
								<div className="text-[#fbbf24] mb-3 flex justify-center">{item.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
								<p className="text-gray-600">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Services Showcase */}
			<section className="py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
						Print services we offer
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[
							{
								name: "Large Format Printing",
								image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
								examples: "Banners, Posters, Signage",
							},
							{
								name: "Document Printing",
								image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop",
								examples: "Business Cards, Flyers, Brochures",
							},
							{
								name: "Stickers & Labels",
								image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
								examples: "Custom Stickers, Vinyl Labels",
							},
							{
								name: "Art & Design",
								image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
								examples: "Art Prints, Canvas, Photo Paper",
							},
						].map((service, index) => (
							<div
								key={index}
								className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#fbbf24] transition-all cursor-pointer group"
							>
								<div className="relative h-48 overflow-hidden">
									<img
										src={service.image}
										alt={service.name}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
								</div>
								<div className="p-4">
									<h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#fbbf24] transition-colors">
										{service.name}
									</h3>
									<p className="text-sm text-gray-600">{service.examples}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Key Features */}
			<section className="py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
						Why choose our platform
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{[
							{
								icon: <MapPin className="w-8 h-8" />,
								title: "Location-Based",
								description: "Find print stations near you. Get your orders faster with local pickup or delivery.",
							},
							{
								icon: <Calculator className="w-8 h-8" />,
								title: "Instant Pricing",
								description: "Get real-time price calculations based on your specifications. No surprises.",
							},
							{
								icon: <Upload className="w-8 h-8" />,
								title: "Easy File Upload",
								description: "Upload multiple design files. Support for images, PDFs, and more.",
							},
							{
								icon: <Clock className="w-8 h-8" />,
								title: "Order Tracking",
								description: "Track your order status from pending to completion in real-time.",
							},
							{
								icon: <Shield className="w-8 h-8" />,
								title: "Secure Payments",
								description: "Pay securely with Paystack. Your payment is protected and verified.",
							},
							{
								icon: <Zap className="w-8 h-8" />,
								title: "Fast Turnaround",
								description: "Connect directly with local print shops for quick order fulfillment.",
							},
						].map((feature, index) => (
							<div
								key={index}
								className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-[#fbbf24] transition-all"
							>
								<div className="text-[#fbbf24] mb-4">{feature.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
								<p className="text-gray-600">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
						What our customers say
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{[
							{
								name: "Ama Mensah",
								location: "Accra, Ghana",
								quote:
									"I found a print station just 2km away! The ordering process was smooth and I got my business cards in 2 days. Highly recommend!",
								image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
							},
							{
								name: "Kwame Asante",
								location: "Kumasi, Ghana",
								quote:
									"The instant pricing feature is amazing. I knew exactly how much my banner would cost before placing the order. Great platform!",
								image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
							},
							{
								name: "Fatou Diallo",
								location: "Dakar, Senegal",
								quote:
									"Being able to track my order status in real-time gave me peace of mind. The print quality was excellent and delivery was on time.",
								image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
							},
						].map((testimonial, index) => (
							<div
								key={index}
								className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#fbbf24] transition-all"
							>
								<div className="flex items-center gap-4 mb-4">
									<img
										src={testimonial.image}
										alt={testimonial.name}
										className="w-16 h-16 rounded-full object-cover"
									/>
									<div>
										<h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
										<p className="text-sm text-gray-600">{testimonial.location}</p>
									</div>
								</div>
								<Quote className="w-6 h-6 text-[#fbbf24] mb-2" />
								<p className="text-gray-700 italic">"{testimonial.quote}"</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Statistics */}
			<section className="py-16 bg-gradient-to-br from-[#fbbf24] to-[#fcd34d]">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-12">
						Connecting customers with print stations across Africa
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="text-5xl font-bold text-black mb-2">200+</div>
							<div className="text-lg text-gray-800">Print Stations</div>
						</div>
						<div className="text-center">
							<div className="text-5xl font-bold text-black mb-2">10K+</div>
							<div className="text-lg text-gray-800">Happy Customers</div>
						</div>
						<div className="text-center">
							<div className="text-5xl font-bold text-black mb-2">50K+</div>
							<div className="text-lg text-gray-800">Orders Completed</div>
						</div>
						<div className="text-center">
							<div className="text-5xl font-bold text-black mb-2">15+</div>
							<div className="text-lg text-gray-800">African Countries</div>
						</div>
					</div>
				</div>
			</section>

			{/* For Print Stations */}
			<section className="py-16 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-12 border-2 border-gray-200">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
							<div>
								<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
									Are you a print station owner?
								</h2>
								<p className="text-lg text-gray-600 mb-6">
									Join our platform to reach more customers, manage orders efficiently, and grow your print business.
								</p>
								<ul className="space-y-3 mb-6">
									{[
										"Get discovered by local customers",
										"Manage orders from one dashboard",
										"Set your own pricing",
										"Track order status and fulfillment",
									].map((benefit, index) => (
										<li key={index} className="flex items-center gap-3">
											<Check className="w-5 h-5 text-[#fbbf24]" />
											<span className="text-gray-700">{benefit}</span>
										</li>
									))}
								</ul>
								<button
									onClick={() => navigate("/register")}
									className="inline-flex items-center gap-2 bg-[#fbbf24] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#fcd34d] transition-all"
								>
									Join as Print Station
									<ArrowRight className="w-5 h-5" />
								</button>
							</div>
							<div className="hidden md:block">
								<div className="bg-[#fbbf24]/10 rounded-xl p-8">
									<Printer className="w-32 h-32 text-[#fbbf24] mx-auto" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-black text-white">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-6">
						Ready to order your print job?
					</h2>
					<p className="text-xl text-gray-300 mb-8">
						Find a print station near you and get started in minutes
					</p>
					<button
						onClick={handleGetStarted}
						className="inline-flex items-center gap-2 bg-[#fbbf24] text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#fcd34d] transition-all transform hover:scale-105 shadow-xl"
					>
						Find Print Stations
						<Navigation className="w-5 h-5" />
					</button>
				</div>
			</section>
		</div>
	);
};
