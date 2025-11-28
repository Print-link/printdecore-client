import { Loader2 } from "lucide-react";

export const LoadingState = () => {
	return (
		<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
			</div>
		</div>
	);
};

