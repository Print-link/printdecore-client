import { MapPin, Phone, EnvelopeSimple } from "@phosphor-icons/react";

interface BranchInfoProps {
	branch: {
		id: string;
		name: string;
		phoneNumber?: string;
		branchEmailAddress?: string;
		location?: {
			id: string;
			address: string;
			latitude: number;
			longitude: number;
		};
	};
}

export const BranchInfo = ({ branch }: BranchInfoProps) => {
	return (
		<div className="py-5 border-t border-line">
			<div className="flex items-center gap-2.5 mb-4">
				<h3 className="text-lg font-bold title-tight text-ink">
					Branch
				</h3>
			</div>
			<div className="space-y-3">
				<div>
					<p className="text-base font-bold text-ink">
						{branch.name}
					</p>
				</div>

				{branch.location?.address && (
					<div className="flex items-start gap-2.5">
						<MapPin size={16} weight="regular" className="text-ink-3 mt-0.5 shrink-0" />
						<p className="text-sm text-ink-2 leading-relaxed">
							{branch.location.address}
						</p>
					</div>
				)}

				{branch.phoneNumber && (
					<div className="flex items-center gap-2.5">
						<Phone size={16} weight="regular" className="text-ink-3 shrink-0" />
						<a href={`tel:${branch.phoneNumber}`} className="text-sm text-ink font-medium hover:text-ink transition-colors">
							{branch.phoneNumber}
						</a>
					</div>
				)}

				{branch.branchEmailAddress && (
					<div className="flex items-center gap-2.5">
						<EnvelopeSimple size={16} weight="regular" className="text-ink-3 shrink-0" />
						<a href={`mailto:${branch.branchEmailAddress}`} className="text-sm text-ink font-medium hover:text-ink transition-colors break-all">
							{branch.branchEmailAddress}
						</a>
					</div>
				)}
			</div>
		</div>
	);
};
