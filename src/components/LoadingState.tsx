import { SpinnerGap } from "@phosphor-icons/react";

export const LoadingState = () => {
	return (
		<div className="w-full max-w-6xl mx-auto bg-surface rounded-xl p-8">
			<div className="flex items-center justify-center py-12">
				<SpinnerGap size={32} weight="bold" className="text-brand-ink animate-spin" />
			</div>
		</div>
	);
};

