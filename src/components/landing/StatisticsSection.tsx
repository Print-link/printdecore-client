const statistics = [
	{ value: "200+", label: "Print Stations" },
	{ value: "10K+", label: "Happy Customers" },
	{ value: "50K+", label: "Orders Completed" },
];

export const StatisticsSection = () => {
	return (
		<section className="py-16 bg-gradient-to-br from-[#fbbf24] to-[#fcd34d]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-12">
					Connecting customers with print stations across Africa
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{statistics.map((stat, index) => (
						<div key={index} className="text-center">
							<div className="text-5xl font-bold text-black mb-2">
								{stat.value}
							</div>
							<div className="text-lg text-gray-800">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

