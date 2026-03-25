import { Van, Info } from "@phosphor-icons/react";

interface DeliveryNoticeProps {
	hasLocation: boolean;
}

export const DeliveryNotice = ({ hasLocation }: DeliveryNoticeProps) => {
	return (
		<div className="bg-amber-50/60 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200/60">
			<div className="flex items-start gap-3.5">
				<div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
					<Van size={18} weight="duotone" className="text-amber-600" />
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1.5">
						<h3 className="text-sm font-bold text-amber-900">
							Pickup Required
						</h3>
						<Info size={14} weight="duotone" className="text-amber-400" />
					</div>
					<p className="text-sm text-amber-700 leading-relaxed">
						Delivery service is currently not available. Please visit the
						print station to collect your order.
						{hasLocation && (
							<>
								{" "}
								Use the{" "}
								<span className="font-semibold text-amber-900">"Get Directions"</span> button
								above to navigate there.
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};
