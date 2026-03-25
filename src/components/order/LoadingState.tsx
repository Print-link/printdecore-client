export const LoadingState = () => {
	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Breadcrumb skeleton */}
			<div className="flex items-center gap-2 mb-6">
				<div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
				<div className="h-4 w-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
				<div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
			</div>

			{/* Header skeleton */}
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
					<div className="flex-1 space-y-4">
						<div className="flex items-center gap-3">
							<div className="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
							<div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
						</div>
						<div className="space-y-2">
							<div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
							<div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
						</div>
					</div>
					<div className="flex gap-2.5">
						<div className="h-10 w-36 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
						<div className="h-10 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
					</div>
				</div>
			</div>

			{/* Stepper skeleton */}
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 px-6 py-4 mb-6">
				<div className="flex items-center justify-between">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="flex items-center flex-1 last:flex-none">
							<div className="flex flex-col items-center">
								<div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
								<div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded mt-1.5 hidden sm:block animate-pulse" />
							</div>
							{i < 6 && <div className="flex-1 h-0.5 mx-2 bg-gray-100 dark:bg-gray-800 rounded-full" />}
						</div>
					))}
				</div>
			</div>

			{/* Content skeleton */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<div className="lg:col-span-2 space-y-5">
					<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 animate-pulse">
						<div className="flex items-center gap-3 mb-5">
							<div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
							<div className="h-5 w-28 bg-gray-100 dark:bg-gray-800 rounded-lg" />
						</div>
						<div className="space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
									<div className="flex justify-between mb-3">
										<div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
										<div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
									</div>
									<div className="grid grid-cols-3 gap-2">
										<div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
										<div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
										<div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="space-y-5">
					{[1, 2].map((i) => (
						<div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
							<div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded mb-4" />
							<div className="space-y-3">
								<div className="flex justify-between">
									<div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
									<div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
								</div>
								<div className="flex justify-between">
									<div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
									<div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
