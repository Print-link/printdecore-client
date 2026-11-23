export const LoadingState = () => {
	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Breadcrumb skeleton */}
			<div className="flex items-center gap-2 mb-6">
				<div className="h-4 w-16 bg-fill rounded-lg animate-pulse" />
				<div className="h-4 w-4 bg-fill rounded animate-pulse" />
				<div className="h-4 w-24 bg-fill rounded-lg animate-pulse" />
			</div>

			{/* Header skeleton */}
			<div className="py-5 border-t border-line mb-4">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
					<div className="flex-1 space-y-4">
						<div className="flex items-center gap-3">
							<div className="h-7 w-24 bg-fill rounded-full animate-pulse" />
							<div className="h-4 w-32 bg-fill rounded-lg animate-pulse" />
						</div>
						<div className="space-y-2">
							<div className="h-3 w-20 bg-fill rounded animate-pulse" />
							<div className="h-10 w-48 bg-fill rounded-lg animate-pulse" />
						</div>
					</div>
					<div className="flex gap-2.5">
						<div className="h-10 w-36 bg-fill rounded-xl animate-pulse" />
						<div className="h-10 w-32 bg-fill rounded-xl animate-pulse" />
					</div>
				</div>
			</div>

			{/* Stepper skeleton */}
			<div className="py-5 border-t border-line mb-6">
				<div className="flex items-center justify-between">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="flex items-center flex-1 last:flex-none">
							<div className="flex flex-col items-center">
								<div className="w-8 h-8 rounded-full bg-fill animate-pulse" />
								<div className="h-2 w-12 bg-fill rounded mt-1.5 hidden sm:block animate-pulse" />
							</div>
							{i < 6 && <div className="flex-1 h-0.5 mx-2 bg-fill rounded-full" />}
						</div>
					))}
				</div>
			</div>

			{/* Content skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<div className="lg:col-span-2 space-y-5">
					<div className="py-5 border-t border-line animate-pulse">
						<div className="flex items-center gap-3 mb-5">
							<div className="w-8 h-8 bg-fill rounded-lg" />
							<div className="h-5 w-28 bg-fill rounded-lg" />
						</div>
						<div className="space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="rounded-xl border border-line p-4">
									<div className="flex justify-between mb-3">
										<div className="h-4 w-16 bg-fill rounded" />
										<div className="h-5 w-24 bg-fill rounded" />
									</div>
									<div className="grid grid-cols-3 gap-2">
										<div className="h-8 bg-fill rounded-lg" />
										<div className="h-8 bg-fill rounded-lg" />
										<div className="h-8 bg-fill rounded-lg" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="space-y-5">
					{[1, 2].map((i) => (
						<div key={i} className="py-5 border-t border-line animate-pulse">
							<div className="h-4 w-28 bg-fill rounded mb-4" />
							<div className="space-y-3">
								<div className="flex justify-between">
									<div className="h-3 w-16 bg-fill rounded" />
									<div className="h-4 w-20 bg-fill rounded" />
								</div>
								<div className="flex justify-between">
									<div className="h-3 w-20 bg-fill rounded" />
									<div className="h-4 w-32 bg-fill rounded" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
