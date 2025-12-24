import { Truck } from "lucide-react";

interface DeliveryNoticeProps {
	hasLocation: boolean;
}

export const DeliveryNotice = ({ hasLocation }: DeliveryNoticeProps) => {
	return (
		<div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
			<div className="flex items-start gap-4">
				<div className="shrink-0 mt-0.5">
					<Truck className="w-6 h-6 text-amber-600" />
				</div>
				<div className="flex-1">
					<h3 className="text-base font-bold text-amber-900 mb-2">
						Delivery Information
					</h3>
					<p className="text-sm text-amber-800">
						Delivery service is currently not available. Please visit the
						print station location to collect your order.
						{hasLocation && (
							<>
								{" "}
								Use the{" "}
								<span className="font-semibold">"Get Directions"</span> button
								above to find the location.
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};

