import { Quotes } from "@phosphor-icons/react";

const testimonials = [
	{
		name: "Ama Mensah",
		location: "Accra, Ghana",
		quote:
			"I found a print station just 2km away! The ordering process was smooth and I got my business cards in 2 days. Highly recommend!",
		image:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
	},
	{
		name: "Kwame Asante",
		location: "Kumasi, Ghana",
		quote:
			"The instant pricing feature is amazing. I knew exactly how much my banner would cost before placing the order. Great platform!",
		image:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
	},
	{
		name: "Fatou Diallo",
		location: "Dakar, Senegal",
		quote:
			"Being able to track my order status in real-time gave me peace of mind. The print quality was excellent and delivery was on time.",
		image:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
	},
];

export const TestimonialsSection = () => {
	return (
		<section className="py-20 bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						What Our Customers Say
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Join thousands of satisfied customers across Africa
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{testimonials.map((testimonial, index) => (
						<div
							key={index}
							className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-[#fbbf24] transition-all hover:shadow-xl"
						>
							<Quotes size={32} weight="duotone" className="text-[#fbbf24] mb-4" />
							<p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
							<div className="flex items-center gap-4">
								<img
									src={testimonial.image}
									alt={`${testimonial.name} from ${testimonial.location}`}
									className="w-12 h-12 rounded-full object-cover"
									loading="lazy"
								/>
								<div>
									<h4 className="font-semibold text-gray-900">
										{testimonial.name}
									</h4>
									<p className="text-sm text-gray-600">
										{testimonial.location}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

