import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "react-toastify";
import { ArrowClockwise } from "@phosphor-icons/react";

export const UpdatePrompt = () => {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_swUrl, r) {
			if (!r) return;
			setInterval(() => {
				r.update();
			}, 60 * 60 * 1000);
		},
	});

	useEffect(() => {
		if (!needRefresh) return;

		const toastId = toast.info(
			<div className="flex items-start gap-3">
				<div className="w-9 h-9 rounded-full bg-[#fbbf24]/20 flex items-center justify-center shrink-0">
					<ArrowClockwise size={18} weight="bold" className="text-[#fbbf24]" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-gray-900 dark:text-white">
						A new version is available
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
						Reload to get the latest improvements.
					</p>
					<div className="flex gap-2 mt-2">
						<button
							onClick={() => {
								updateServiceWorker(true);
							}}
							className="px-3 py-1.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-bold rounded-lg transition-colors"
						>
							Reload
						</button>
						<button
							onClick={() => {
								setNeedRefresh(false);
								toast.dismiss(toastId);
							}}
							className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
						>
							Later
						</button>
					</div>
				</div>
			</div>,
			{
				autoClose: false,
				closeOnClick: false,
				closeButton: false,
				draggable: false,
				position: "bottom-right",
				icon: false,
				className: "!p-3",
			}
		);
	}, [needRefresh, updateServiceWorker, setNeedRefresh]);

	return null;
};
