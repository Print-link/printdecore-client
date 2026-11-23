import { Info } from "@phosphor-icons/react";

interface DeliveryNoticeProps {
	hasLocation: boolean;
}

export const DeliveryNotice = ({ hasLocation }: DeliveryNoticeProps) => {
	return (
		<div className="bg-brand-tint rounded-xl p-5">
			<div className="flex items-start gap-3.5">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1.5">
						<h3 className="text-sm font-bold text-ink">
							Pickup Required
						</h3>
						<Info size={14} weight="regular" className="text-brand-ink" />
					</div>
					<p className="text-sm text-ink-2 leading-relaxed">
						Delivery service is currently not available. Please visit the
						print station to collect your order.
						{hasLocation && (
							<>
								{" "}
								Use the{" "}
								<span className="font-semibold text-ink">"Get Directions"</span> button
								above to navigate there.
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};
