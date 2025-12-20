export const LoadingState = () => {
	return (
		<div className="w-full max-w-4xl mx-auto bg-white p-4 lg:p-8">
			<div className="text-center py-12">
				<div className="w-12 h-12 border-4 border-[#63A361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<p className="text-gray-500">Loading order details...</p>
			</div>
		</div>
	);
};

